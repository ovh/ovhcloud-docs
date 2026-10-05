# use DataPlatform Python SDK 
from forepaas.dwh import connect
from forepaas.core.settings import CONFIG
from forepaas.dwh import bulk_insert

# import Python Pandas and Numpy to manage Python dataframe
import pandas as pd
import numpy as np
import os
import sys
import logging

logger = logging.getLogger(__name__)

def cafe_sales_data_cleaning(event):
    # make connection
    connector = connect("dwh/default_dataset/")

    # extract data from table
    df = connector.select("dirty_cafe_sales")
    logger.notice("Table connexion done")

    # /// START CLEANING \\\
    logger.notice("Start cleaning")

    # columns to clean
    columns_to_clean = ['item', 'quantity', 'price_per_unit', 'total_spent']

    # replace 'ERROR' and 'UNKNOWN' with NaN
    for col in columns_to_clean:
        
        df[col] = df[col].replace(['ERROR', 'UNKNOWN', ''], np.nan)
        # convert numerical columns to float
        if col != 'item': 
            df[col] = df[col].astype(float)

    # item / price dictionnary
    item_price = {
        'Coffee': 2.0, 'Tea': 1.5, 'Sandwich': 4.0, 'Salad': 3.0,
        'Cake': 3.0, 'Cookie': 1.0, 'Smoothie': 4.0, 'Juice': 3.0
    }
    logger.info("Test3")
    # reverse - Price / item dictionnary
    price_item = {price: item for item, price in item_price.items()}

    # define a maximum number of iterations to avoid an infinite loop
    max_iterations = 3
    iteration = 0

    # loop to fill NaNs as fully as possible thanks to correlation between 'item', 'price_per_unit', 'quantity' and 'total_spent'
    while df['item'].notna().sum() > 0 and iteration < max_iterations:

        # total_spent = price_per_unit * quantity
        df['price_per_unit'] = df['price_per_unit'].fillna(df['total_spent'] / df['quantity'])
        df['quantity'] = df['quantity'].fillna(df['total_spent'] / df['price_per_unit'])
        df['total_spent'] = df['total_spent'].fillna(df['price_per_unit'] * df['quantity'])

        # 'Coffee': 2.0, 'Tea': 1.5, 'Sandwich': 4.0, 'Salad': 3.0, 'Cake': 3.0, 'Cookie': 1.0, 'Smoothie': 4.0, 'Juice': 3.0
        df['price_per_unit'] = df['price_per_unit'].fillna(df['item'].map(item_price))
        df['item'] = df['item'].fillna(df['price_per_unit'].map(price_item))

        iteration += 1

    # delete the remaining missing values
    df = df.dropna(subset=['item', 'quantity', 'transaction_date'])
    logger.info(len(df))
    logger.info("Dataframe processing done")

    # reinsert dataframe in the destination table
    stats, err = bulk_insert(connector, "clean_cafe_sales", df)
    logger.info(stats)
    logger.info(err)
    logger.info("Table updated!")

    # /// STOP CLEANING \\\
    del connector 
    logger.notice("Stop cleaning")