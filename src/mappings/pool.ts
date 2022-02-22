import { ethereum, log, BigInt } from '@graphprotocol/graph-ts'

import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityOne,
} from '../../generated/3Pool/ThreePoolPlusSusd'

import {
  AddLiquidityEvent,
  RemoveLiquidityEvent,
  RemoveLiquidityOneEvent,
  LiquidityProvision
} from '../../generated/schema'

import { getOrRegisterAccount } from '../services/accounts'

export function handleAddLiquidity(event: AddLiquidity): void {
  let token_amounts = event.params.token_amounts;
  let amountAdded = token_amounts.reduce((acc, token_amount) => {
    return acc.plus(token_amount);
  }, BigInt.fromString('0'));

  let provider = getOrRegisterAccount(event.params.provider)

  // Save event log
  let eventLog = new AddLiquidityEvent('al-' + getEventId(event))
  eventLog.provider = provider.id
  eventLog.tokenAmounts = event.params.token_amounts
  eventLog.fees = event.params.fees
  eventLog.invariant = event.params.invariant
  eventLog.tokenSupply = event.params.token_supply
  eventLog.block = event.block.number
  eventLog.timestamp = event.block.timestamp
  eventLog.transaction = event.transaction.hash
  eventLog.save()

  // Update Liquidity Provision
  let liquidityProvision = LiquidityProvision.load(event.params.provider.toHexString());

  if (liquidityProvision != null) {
    liquidityProvision.amount = liquidityProvision.amount.plus(amountAdded);
    liquidityProvision.save();
  } else {
    liquidityProvision = new LiquidityProvision(event.params.provider.toHexString());
    liquidityProvision.account = event.params.provider.toHexString();
    liquidityProvision.amount = amountAdded;
    liquidityProvision.save();
  }
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let token_amounts = event.params.token_amounts;

  let amountRemoved = token_amounts.reduce((acc, token_amount) => {
    return acc.plus(token_amount);
  }, BigInt.fromString('0'));

  let provider = getOrRegisterAccount(event.params.provider)

  // Save event log
  let eventLog = new RemoveLiquidityEvent('rl-' + getEventId(event))
  eventLog.provider = provider.id
  eventLog.tokenAmounts = event.params.token_amounts
  eventLog.fees = event.params.fees
  eventLog.tokenSupply = event.params.token_supply
  eventLog.block = event.block.number
  eventLog.timestamp = event.block.timestamp
  eventLog.transaction = event.transaction.hash
  eventLog.save()

  // Update Liquidity Provision
  let liquidityProvision = LiquidityProvision.load(event.params.provider.toHexString());

  if (liquidityProvision != null) {
    liquidityProvision.amount = liquidityProvision.amount.minus(amountRemoved);
    liquidityProvision.save()
  } else {
    // We should never get to this case
    log.error('handleRemoveLiquidity invoked but LiquidityProvision not found {}', [event.params.provider.toHexString()])
  }
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let amountRemoved = event.params.token_amount;

  let provider = getOrRegisterAccount(event.params.provider)

  // Save event log
  let eventLog = new RemoveLiquidityOneEvent('rlo-' + getEventId(event))
  eventLog.provider = provider.id
  eventLog.tokenAmount = event.params.token_amount
  eventLog.coinAmount = event.params.coin_amount
  eventLog.block = event.block.number
  eventLog.timestamp = event.block.timestamp
  eventLog.transaction = event.transaction.hash
  eventLog.save()

  // Update Liquidity Provision
  let liquidityProvision = LiquidityProvision.load(event.params.provider.toHexString());

  if (liquidityProvision != null) {
    liquidityProvision.amount = liquidityProvision.amount.minus(amountRemoved);
    liquidityProvision.save()
  } else {
    // We should never get to this case
    log.error('handleRemoveLiquidity invoked but LiquidityProvision not found {}', [event.params.provider.toHexString()])
  }
}

function getEventId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
}