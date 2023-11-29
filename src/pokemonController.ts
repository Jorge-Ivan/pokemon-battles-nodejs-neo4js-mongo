import ConnectionNeo from "./models/connection-neo";
import Pokemon from "./models/pokemon";

const JUST_BULBASAUR: Pokemon =
  {
      name: "Bulbasaur",
      species: "Seed Pokémon",
      description: "Bulbasaur can be seen napping in bright sunlight. There is a seed on its back. By soaking up the sun’s rays, the seed grows progressively larger.",
      hires: "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/hires/001.png",
      thumbnail: "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/thumbnails/001.png",
      sprite: "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/001.png",
      types: ["Grass", "Poison"]
  };

const pokemonController = {

  listPokemon: async (limit: number = -1, offset: number = -1): Promise<Pokemon[]> => {
    return ConnectionNeo.listPokemon(limit, offset)
      .then((data:Pokemon[]) => {
        return data;
      })
      .catch((error) => {
        console.error(error)
        return [];
      });
  },

  queryPokemon: async (query: string | Partial<Pokemon>, limit: number = -1, offset: number = 0): Promise<Pokemon[]> => {
    return ConnectionNeo.getPokemon(query, limit, offset)
      .then((data:Pokemon[]) => {
        return data;
      })
      .catch((error) => {
        console.error(error)
        return [];
      });
  },

  getEvolutions: async (pid: number): Promise<Pokemon[]> => {
    return ConnectionNeo.getEvolutions(pid)
      .then((data:Pokemon[]) => {
        return data;
      })
      .catch((error) => {
        console.error(error)
        return [];
      });
  },

  simulateBattle: async (teamA: [number, number, number], teamB: [number, number, number]): Promise<[number, number, number]> => {
    if(teamA.length == teamB.length) {
      let resulBattle:[number,number,number] = [0,0,0];
      for (let index = 0; index < teamA.length; index++) {
        const efectiveA = await ConnectionNeo.simulateBattle(teamA[index], teamB[index])
        .then((efective:boolean) => {
          return efective;
        })
        .catch((error) => {
          console.error(error)
          return [];
        });

        const efectiveB = await ConnectionNeo.simulateBattle(teamB[index], teamA[index])
        .then((efective:boolean) => {
          return efective;
        })
        .catch((error) => {
          console.error(error)
          return [];
        });

        if(efectiveA == efectiveB){
          resulBattle[index] = 0;
        }else if(efectiveA){
          resulBattle[index] = 1;
        }else if(efectiveB){
          resulBattle[index] = -1;
        }
      }
      return resulBattle;
    }else{
      throw 'Los equipos no tienen la misma cantidad de pokemons';
    }
  },

  findStrongAgainst: async (pid: number | number[]): Promise<any> => {
    return ConnectionNeo.findStrongAgainst(pid)
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.error(error)
        return [];
      });
  }
};

export default pokemonController;