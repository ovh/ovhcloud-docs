# Custom action: clean the Online Retail II dataset
# Source: Online Retail II, UCI Machine Learning Repository, CC BY 4.0, DOI 10.24432/C5CG6D
#
# Reads the raw table online_retail_ii, removes exact duplicates and rows that
# contradict the UCI variable description, harmonizes product descriptions,
# then writes the result to online_retail_ii_clean.
# The raw table is never modified.

# Data Platform Python SDK
from forepaas.dwh import connect
from forepaas.dwh import bulk_insert

import logging

import pandas as pd

logger = logging.getLogger(__name__)

DATASET = "dwh/default_dataset/"
SOURCE_TABLE = "online_retail_ii"
TARGET_TABLE = "online_retail_ii_clean"

ORIGINAL_COLUMNS = [
    "invoice", "stockcode", "description",
    "quantity", "invoicedate", "price",
    "customer_id", "country",
]
TEXT_COLUMNS = ["invoice", "stockcode", "description", "country"]


def invalid_rows(df):
    """Cleaning rules based on the UCI variable description.
    Each rule returns True for the rows to remove.
    There is no rule on the customer or the country: a sale without
    either one is still a sale."""
    is_cancellation = df["invoice"].str.upper().str.startswith("C", na=False)

    return {
        # 6-digit number, prefixed with "C" for a cancellation
        "2. Invalid invoice number": ~df["invoice"].str.fullmatch(r"[Cc]?\d{6}", na=False),
        # 5-digit code; a trailing letter marks a variant of the same product
        "3. Invalid stock code": ~df["stockcode"].str.fullmatch(r"\d{5}[A-Za-z]*", na=False),
        "4. Missing description": df["description"].isna(),
        # A sale has a positive quantity, a cancellation a negative one
        "5. Inconsistent quantity": ~(
            (~is_cancellation & (df["quantity"] > 0))
            | (is_cancellation & (df["quantity"] < 0))
        ),
        "6. Zero or negative price": ~(df["price"] > 0),
        "7. Missing invoice date": df["invoicedate"].isna(),
    }


def most_frequent_descriptions(df):
    """Most frequent description for each stock code.
    Ties are broken alphabetically, so every run gives the same result."""
    counts = df.groupby(["stockcode", "description"]).size().reset_index(name="lines")
    counts = counts.sort_values(["stockcode", "lines", "description"], ascending=[True, False, True])
    return counts.drop_duplicates("stockcode").set_index("stockcode")["description"]


def online_retail_cleaning(event):
    connector = connect(DATASET)
    df = connector.select(SOURCE_TABLE)
    logger.info(f"{len(df)} rows read from {SOURCE_TABLE}")

    # Trim text values; empty strings become missing values
    for column in TEXT_COLUMNS:
        df[column] = df[column].str.strip().replace("", pd.NA)

    # 1. Exact duplicates across the 8 original columns
    before = len(df)
    df = df.drop_duplicates(subset=ORIGINAL_COLUMNS, keep="first")
    logger.info(f"1. Exact duplicates: {before - len(df)} rows removed")

    # 2 to 7. Invalid values: a row can break several rules
    rules = invalid_rows(df)
    for name, mask in rules.items():
        logger.info(f"{name}: {int(mask.sum())} rows affected")

    excluded_codes = df.loc[rules["3. Invalid stock code"], "stockcode"].value_counts()
    logger.info(f"Most frequent excluded stock codes: {excluded_codes.head(30).to_dict()}")

    to_remove = pd.concat(rules.values(), axis=1).any(axis=1)
    before = len(df)
    df = df[~to_remove].copy()
    logger.info(f"Invalid values: {before - len(df)} rows removed in total")

    # 8. One description per stock code: the most frequent one
    codes_with_variants = int((df.groupby("stockcode")["description"].nunique() > 1).sum())
    reference = most_frequent_descriptions(df)
    harmonized = df["stockcode"].map(reference)
    logger.info(f"8. Harmonized descriptions: {codes_with_variants} stock codes had several descriptions, "
                f"{int((harmonized != df['description']).sum())} rows updated")
    df["description"] = harmonized

    df["is_cancellation"] = df["invoice"].str.upper().str.startswith("C")
    logger.info(f"Cancellations kept: {int(df['is_cancellation'].sum())}")
    logger.info(f"Rows kept without a customer: {int(df['customer_id'].isna().sum())}")

    stats, err = bulk_insert(connector, TARGET_TABLE, df)
    logger.info(stats)
    logger.info(err)
    logger.info(f"{len(df)} rows written to {TARGET_TABLE}")

    del connector