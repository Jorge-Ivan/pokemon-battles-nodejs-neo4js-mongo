import neo4j, { Driver, Result, QueryResult } from 'neo4j-driver';
import Pokemon from './pokemon';

interface ConnectionResult {
    message: string;
}

interface PokemonResult {
    records: Result[];
    summary: QueryResult;
    keys: string[];
}

const ConnectionNeo = {
    
    async listPokemon(limit:Number=10, offset:Number = -1): Promise<Pokemon[]> {
        let driver: Driver | undefined;
        try {
            const URI = process.env.NEO_URI || '';
            const USER = process.env.NEO_USER || '';
            const PASSWORD = process.env.NEO_PASSWORD || '';

            driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
            const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });
            const queryNeo = `MATCH (p:Pokemon)-[:Is]->(s:Specie)
            MATCH (p)-[:Has *]->(t:Type)
            RETURN p, s.name as species, COLLECT(t.name) AS types ${((offset!=-1)?`SKIP ${offset}`:'')} ${((limit!=-1)?`LIMIT ${limit}`:'')}`;
            const result = await session.run(queryNeo);
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p').properties as any), ...({'species':record.get('species')} as any), ...({'types':record.get('types')} as any) };});
            await session.close();
            return pokemons;
        } catch (err) {
            console.error(`Query error\n${err}\nCause`,err);
            return [];
        } finally {
            if (driver) {
                await driver.close();
            }
        }
    },

    async getPokemon(query: string | Partial<Pokemon>, limit:Number=10, offset:Number = -1): Promise<Pokemon[]> {
        let driver: Driver | undefined;
        try {
            const URI = process.env.NEO_URI || '';
            const USER = process.env.NEO_USER || '';
            const PASSWORD = process.env.NEO_PASSWORD || '';

            let queryParams: { [key: string]: any } = {};
            if (typeof query === 'object') {
                queryParams.name = query.name || '';
                queryParams.description = query.description || '';
                queryParams.species = query.species || '';
                if (query.types) 
                {
                    queryParams.types = '"'+query.types.join('","')+'"';
                }else{
                    queryParams.types = '';
                }
            } else if (typeof query === 'string') {
                queryParams.name = query;
                queryParams.description = query;
                queryParams.species = query;
                queryParams.types = query;
            } else {
                throw new Error('Invalid query type');
            }

            driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
            const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });
            const queryNeo = `MATCH (p:Pokemon)-[:Is]->(s:Specie)
            MATCH (p)-[:Has *]->(t:Type)
            WHERE 
              ${(queryParams.name.length>0)?'p.name CONTAINS "'+queryParams.name+'" ':'false'} OR
              ${(queryParams.description.length>0)?'p.description CONTAINS "'+queryParams.description+'" ':'false'} OR
              ${(queryParams.species.length>0)?'s.name CONTAINS "'+queryParams.species+'" ':'false'} OR
              ${(queryParams.types.length>0)?'t.name IN ['+queryParams.types+']':'false'} 
            RETURN p, s.name AS species, COLLECT(t.name) AS types ${((offset!=-1)?`SKIP ${offset}`:'')} ${((limit!=-1)?`LIMIT ${limit}`:'')}`;
            console.log(queryParams)
            const result = await session.run(queryNeo);
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p').properties as any), ...({'species':record.get('species')} as any), ...({'types':record.get('types')} as any) };});
            await session.close();
            return pokemons;
        } catch (err) {
            console.error(`Query error\n${err}\nCause`,err);
            return [];
        } finally {
            if (driver) {
                await driver.close();
            }
        }
    },

    async getEvolutions(pid: number): Promise<Pokemon[]> {
        let driver: Driver | undefined;
        try {
            const URI = process.env.NEO_URI || '';
            const USER = process.env.NEO_USER || '';
            const PASSWORD = process.env.NEO_PASSWORD || '';

            driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
            const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });
            const queryNeo = `MATCH (pquery:Pokemon)
            WHERE pquery.id = $pid
            MATCH path=(pquery)-[:Evolution_Next *]->(p)-[:Is]->(s:Specie)
            MATCH (p)-[:Has *]->(t:Type)
            RETURN p,s.name as species, COLLECT(t.name) AS types`;

            const result = await session.run(queryNeo, {pid:pid});
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p').properties as any), ...({'species':record.get('species'), ...({'types':record.get('types')} as any)} as any) };});
            await session.close();
            return pokemons;
        } catch (err) {
            console.error(`Query error\n${err}\nCause`,err);
            return [];
        } finally {
            if (driver) {
                await driver.close();
            }
        }
    },

    async simulateBattle(pid1: number,pid2: number): Promise<boolean> {
        let driver: Driver | undefined;
        try {
            const URI = process.env.NEO_URI || '';
            const USER = process.env.NEO_USER || '';
            const PASSWORD = process.env.NEO_PASSWORD || '';

            driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
            const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });
            const queryNeo = `MATCH (p1:Pokemon {id:$pid1})-[h1:Has]->(t1:Type)
            MATCH (p2:Pokemon {id:$pid2})-[h2:Has]->(t2:Type)
            WHERE (t1)-[:Effective]->(t2)
            RETURN COUNT(*) <> 0 AS effective LIMIT 1
            `;
            const result = await session.run(queryNeo, {pid1:pid1, pid2:pid2});
            const resultEffective:boolean = (result.records.length>0)?result.records[0].get('effective')==1:false;
            await session.close();
            return resultEffective;
        } catch (err) {
            console.error(`Query error\n${err}\nCause`,err);
            return false;
        } finally {
            if (driver) {
                await driver.close();
            }
        }
    },

    async findStrongAgainst(pid: number | number[]): Promise<Pokemon|null> {
        let driver: Driver | undefined;
        try {
            const URI = process.env.NEO_URI || '';
            const USER = process.env.NEO_USER || '';
            const PASSWORD = process.env.NEO_PASSWORD || '';

            driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
            const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });
            let queryParams:string;
            if(typeof pid === 'object'){
                queryParams = pid.join(',');
            }else{
                queryParams = pid.toString();
            }
            const queryNeo = `MATCH (p1:Pokemon where p1.id in [${queryParams}])-[h1:Has]->(t1:Type)<-[e:Effective]-(t2:Type)<-[h2:Has]-(p2:Pokemon)-[:Is]->(s:Specie)
            MATCH (p2)-[:Has *]->(t:Type)
            WHERE p2 <> p1 and NOT (p1)-[:Effective *]->(p2)
            RETURN p2, s.name as species, COLLECT(t.name) AS types
            ORDER BY RAND()
            limit 1
            `;
            const result = await session.run(queryNeo);
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p2').properties as any), ...({'species':record.get('species')} as any), ...({'types':record.get('types')} as any) };});
            await session.close();
            return pokemons[0];
        } catch (err) {
            console.error(`Query error\n${err}\nCause`,err);
            return null;
        } finally {
            if (driver) {
                await driver.close();
            }
        }
    }
};

export default ConnectionNeo;