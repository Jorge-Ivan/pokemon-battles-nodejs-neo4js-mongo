import Battle from "./models/battle";
import ConnectionMongo from "./models/connection-mongo";

const SAMPLE_BATTLE:Battle = {
    date: new Date(),
    playerA: "Brent",
    playerB: "Sam",
    teamA: [1, 2, 3],
    teamB: [4, 5, 6],
    resultado: [-1, -1, -1],
    winner: "B"
};

async function saveBattle(battle:Battle):Promise<boolean> {
    try {
        await ConnectionMongo.connect();
        let collection = ConnectionMongo.getCollection();
        const insertManyResult = await collection.insertOne(battle);
        ConnectionMongo.close();
        console.log(`${insertManyResult.insertedId} document successfully inserted.\n`);
        return true;
    } catch (err) {
        console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
        return false;
    }
}

async function queryBattles(findQuery:Partial<Battle>, limit:number = -1, offset:number = 0)
{
    let agg: Array<Partial<{ $match: Partial<Battle>; $skip?: number; $limit?: number }>> = [
        {
          $match: findQuery
        },
        {
          $skip: offset
        }
    ];
      
    if (limit !== -1) {
        agg.push(
            {
            $limit: limit
            }
        );
    }
    try {
        await ConnectionMongo.connect();
        let collection = ConnectionMongo.getCollection();
        const cursor = await collection.aggregate(agg);
        const result = await cursor.toArray();
        ConnectionMongo.close();
        return result;
    } catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        return [];
    }
}

const battleController = {
    saveBattle,
    queryBattles
};

export default battleController;