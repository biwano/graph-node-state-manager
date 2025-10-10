import { BigInt, ethereum, Address, log } from "@graphprotocol/graph-ts";
import { Account } from "../generated/schema";
import { AccountRegistered, StateReset, StateUpdated } from "../generated/TimedContract/TimedContract";

function getOrCreateAccount(accountAddress: Address, block: ethereum.Block): Account {
  const accountId = accountAddress.toHexString();
  let account = Account.load(accountId);
  
  if (account == null) {
    log.info("Creating new account: {}", [accountId]);
    account = new Account(accountId);
    account.address = accountAddress;
    account.state = "INITIAL";
    account.registeredAt = block.timestamp;
    account.lastUpdatedAt = block.timestamp;
    account.totalResets = BigInt.zero();
    account.totalUpdates = BigInt.zero();
  } else {
    log.info("Loading existing account: {}", [accountId]);
  }
  
  return account;
}

export function handleAccountRegistered(event: AccountRegistered): void {
  const accountId = event.params.account.toHexString();
  log.info("Processing AccountRegistered event for account: {} at block: {}", [
    accountId,
    event.block.number.toString()
  ]);
  
  const account = getOrCreateAccount(event.params.account, event.block);
  account.save();
  
  log.info("Account registered successfully: {}", [accountId]);
}

export function handleStateReset(event: StateReset): void {
  const accountId = event.params.account.toHexString();
  log.info("Processing StateReset event for account: {} at block: {}", [
    accountId,
    event.block.number.toString()
  ]);
  
  const account = getOrCreateAccount(event.params.account, event.block);
  const previousState = account.state;
  account.state = "INITIAL";
  account.lastUpdatedAt = event.block.timestamp;
  account.totalResets = account.totalResets.plus(BigInt.fromI32(1));
  account.save();
  
  log.info("Account state reset: {} from {} to INITIAL, total resets: {}", [
    accountId,
    previousState,
    account.totalResets.toString()
  ]);
}

export function handleStateUpdated(event: StateUpdated): void {
  const accountId = event.params.account.toHexString();
  log.info("Processing StateUpdated event for account: {} at block: {}", [
    accountId,
    event.block.number.toString()
  ]);
  
  const account = getOrCreateAccount(event.params.account, event.block);
  const previousState = account.state;
  account.state = "UPDATED";
  account.lastUpdatedAt = event.block.timestamp;
  account.totalUpdates = account.totalUpdates.plus(BigInt.fromI32(1));
  account.save();
  
  log.info("Account state updated: {} from {} to UPDATED, total updates: {}", [
    accountId,
    previousState,
    account.totalUpdates.toString()
  ]);
}

