import fs from "fs";
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
const checkID = "164525273503498240"; // Craven
const json = fs.readFileSync("../transactionHistory.json", "utf8");
const data: Item[] = JSON.parse(json);
let totalSent = 0;
let totalRec = 0;
function handleItem(item: Item) {
	switch (item.type) {
		case ItemType.TransactionV1:
			if (item.receiver == checkID) {
				// console.log(`${item.sender} -> ${item.receiver} (${item.amount})`);
				totalRec += item.amount;
			}
			if (item.sender == checkID) {
				// console.log(`${item.sender} -> ${item.receiver} (${item.amount})`);
				totalSent += item.amount;
			}
			break;
		case ItemType.TransactionV2:
		case ItemType.TransactionV3:
			if (item.receiver_id == checkID) {
				// console.log(`${item.sender_id} -> ${item.receiver_id} (${item.amount})`);
				totalRec += item.amount;
			}
			if (item.sender_id == checkID) {
				// console.log(`${item.sender_id} -> ${item.receiver_id} (${item.amount})`);
				totalSent += item.amount;
			}
			break;
	}
}
data.forEach(item => {
	assignType(item);
	handleItem(item);
});
console.log(`Total chips sent: ${totalSent}\nToatal chips recived: ${totalRec}\nDiff: ${totalRec - totalSent}`);

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