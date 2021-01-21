import fs from "fs";
import { send } from "process";
import { formatWithOptions } from "util";
// type TransactionDetails = "Payment issued through !pay" | "Chips claimed" | "Market purchase";
interface DBItem {
	_id: {
		$oid: string;
	};
	type: ItemType;
}
interface TransactionV1 extends DBItem {
	sender: string;
	receiver: string;
	amount: number;
	date: {
		$date: string;
	}
	type: ItemType.TransactionV1;
}
interface TransactionV2 extends DBItem {
	_id: {
		$oid: string;
	};
	sender_id: string;
	receiver_id: string;
	details: "Payment issued through !pay";
	amount: number;
	date: {
		$date: string;
	};
	type: ItemType.TransactionV2;
}
interface TransactionV3 extends DBItem {
	_id: {
		$oid: string;
	};
	sender_id: string;
	receiver_id: string;
	details: "Payment issued through !pay";
	amount: number;
	sender_chips_before: number;
	receiver_chips_before: number;
	class: string;
	date: {
		$date: string;
	};
	type: ItemType.TransactionV3;
}
interface MarketBuy extends DBItem {
	details: "Market purchase",
	receiver_chips_before: number;
	date: {
		$date: string;
	}
	type: ItemType.MarketBuy;
}
interface ChipClaim extends DBItem {
	details: "Chips claimed";
	receivers: Array<{
		user_id: string;
		claim_date: {
			$date: string
		}
	}>;
	type: ItemType.ChipClaim;
}
type Transaction = TransactionV1 | TransactionV2 | TransactionV3;
type OtherItem = MarketBuy | ChipClaim;
type Item = Transaction | OtherItem;
enum ItemType {
	TransactionV1,
	TransactionV2,
	TransactionV3,
	MarketBuy,
	ChipClaim
}
interface SimpleTransaction {
	sender: string;
	reciever: string;
	amount: number;
};
function resolveType(item: Item): ItemType {
	//@ts-ignore
	if (item.details == undefined) return ItemType.TransactionV1;
	//@ts-ignore
	if (item.details == "Payment issued through !pay") {
		//@ts-ignore
		if (item.sender_chips_before == undefined) return ItemType.TransactionV2;
		return ItemType.TransactionV3;
	}
	//@ts-ignore
	if (item.details == "Market purchase") return ItemType.MarketBuy;
	//@ts-ignore
	if (item.details == "Chips claimed") return ItemType.ChipClaim;
}
function assignType(item: Item): void {
	item.type = resolveType(item);
}
// const checkID = "272143648114606083"; // Me
// const checkID = "456465826728378382" // Kieffer
// const checkID = "265004575142969344"; // Claw
// const checkID = "165195486746116096"; // Garag
// const checkID = "164525273503498240"; // Craven
const json = fs.readFileSync("../transactionHistory.json", "utf8");
const data: Item[] = JSON.parse(json);
const handledUsers: string[] = [];
const transactions: SimpleTransaction[] = [];

function makeUserData(id: string) {
	handledUsers.push(id);

	const recives: Record<string, number> = {};
	const sends: Record<string, number> = {};
	transactions.forEach(transaction => {
		if (transaction.sender == id) {
			if (!sends[transaction.reciever]) sends[transaction.reciever] = 0;
			sends[transaction.reciever] += transaction.amount;
		}
		if (transaction.reciever == id) {
			if (!recives[transaction.sender]) recives[transaction.sender] = 0;
			recives[transaction.sender] += transaction.amount;
		}
	});
	const sum: Record<string, number> = {};
	Object.keys(recives).forEach(userID => {
		if (!sum[userID]) sum[userID] = 0;
		sum[userID] = recives[userID];
		if (sends[userID]) sum[userID] -= sends[userID];
	});
	Object.keys(sends).forEach(userID => {
		if (!sum[userID]) sum[userID] = 0;
		if (recives[userID]) sum[userID] = recives[userID];
		sum[userID] -= sends[userID];
	});
	const csv = Object.keys(sum).map(uid => `${uid},${sum[uid]}`).join("\n");
	if (csv.length > 0) fs.writeFileSync(`../users/${id}.csv`, csv);
}
function startUser(id: string) {
	if (handledUsers.includes(id)) return;
	handledUsers.push(id);
	makeUserData(id);
}
function init() {
	data.forEach(assignType);
	data.forEach(item => {
		let isTransaction = false;
		let sender = "";
		let reciever = "";
		let amount = 0;
		switch (item.type) {
			case ItemType.TransactionV1:
				isTransaction = true;
				sender = item.sender;
				reciever = item.receiver;
				amount = item.amount;
				break;
			case ItemType.TransactionV2:
			case ItemType.TransactionV3:
				isTransaction = true;
				sender = item.sender_id;
				reciever = item.receiver_id;
				amount = item.amount;
				break;
		}
		if (isTransaction) {
			transactions.push({ sender, reciever, amount });
		}
	});
}
function run() {
	transactions.forEach(transaction => {
		startUser(transaction.sender);
		startUser(transaction.reciever);
	});
}
init();
run();

/*
{
  "_id": {
	 "$oid": "60078e67399f0ef46d8a47b6"
  },
  "sender_id": "272143648114606083",
  "receiver_id": "164525273503498240",
  "details": "Payment issued through !pay",
  "amount": 659,
  "sender_chips_before": 659,
  "receiver_chips_before": 394,
  "class": "class objects.transactions.PersonalTransaction",
  "date": {
	 "$date": "2021-01-20T01:59:03.121Z"
  }
},
*/