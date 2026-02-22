"""XRP Ledger wallet service using xrpl-py on Testnet."""

import asyncio
from functools import partial
from xrpl.wallet import generate_faucet_wallet, Wallet
from xrpl.clients import JsonRpcClient

TESTNET_URL = "https://s.altnet.rippletest.net:51234"


def _create_wallet_sync() -> dict:
    """Synchronously generate a funded XRP Testnet wallet."""
    client = JsonRpcClient(TESTNET_URL)
    wallet = generate_faucet_wallet(client, debug=False)
    return {
        "address": wallet.address,
        "seed": wallet.seed,
    }


async def create_patient_wallet() -> dict:
    """Generate a new funded XRP Testnet wallet for a patient.

    Runs the synchronous xrpl-py call in a thread pool to avoid
    blocking the async event loop.

    Returns:
        dict with keys: address, seed
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _create_wallet_sync)
