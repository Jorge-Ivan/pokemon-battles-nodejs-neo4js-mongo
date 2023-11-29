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
            RETURN p, s.name as species ${((offset!=-1)?`SKIP ${offset}`:'')} ${((limit!=-1)?`LIMIT ${limit}`:'')}`;
            const result = await session.run(queryNeo);
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p').properties as any), ...({'species':record.get('species')} as any) };});
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

            driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
            const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });
            const queryNeo = `MATCH (p:Pokemon)-[:Is]->(s:Specie)
            WHERE p.name CONTAINS $name OR p.description CONTAINS $description OR s.name CONTAINS $species
            RETURN p, s.name as species ${((offset!=-1)?`SKIP ${offset}`:'')} ${((limit!=-1)?`LIMIT ${limit}`:'')}`;
            let queryParams: { [key: string]: any } = {};
            if (typeof query === 'object') {
                if (query.name) queryParams.name = query.name;
                if (query.description) queryParams.description = query.description;
                if (query.species) queryParams.specie = query.species;
            } else if (typeof query === 'string') {
                queryParams.name = query;
                queryParams.description = query;
                queryParams.species = query;
            } else {
                throw new Error('Invalid query type');
            }
            const result = await session.run(queryNeo, queryParams);
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p').properties as any), ...({'species':record.get('species')} as any) };});
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
            RETURN p,s.name as species`;

            const result = await session.run(queryNeo, {pid:pid});
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p').properties as any), ...({'species':record.get('species')} as any) };});
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
            WHERE p2 <> p1 and NOT (p1)-[:Effective *]->(p2)
            RETURN p2, s.name as species 
            ORDER BY RAND()
            limit 1
            `;
            const result = await session.run(queryNeo);
            const pokemons: Pokemon[] = result.records.map((record) => {return { ...(record.get('p2').properties as any), ...({'species':record.get('species')} as any) };});
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