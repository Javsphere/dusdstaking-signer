# DUSD Staking Signer

## Overview

This project is a Node.js application built on Express, designed for managing and processing EVM-based multisig transactions. 
It offers an API for various operations like confirming EVM multisig transactions and signing transaction packages.

## Key Features

- Sign transaction for DUSD-Staking Product of Javpshere

## Technical Details

- Utilizes `express` for server setup.
- Uses custom controllers for handling API endpoints.
- Implements comprehensive logging and error handling.
- Includes CORS support and HTTP logging.

## Installation

- git clone
- npm install
- npm start

## API Endpoints

 - POST /api/confirmEvmTransfer: Confirm an EVM multisig transaction.
 - POST /api/confirmEvm: Another method to confirm an EVM multisig transaction.
 - POST /api/signTxs: Sign transaction packages.
