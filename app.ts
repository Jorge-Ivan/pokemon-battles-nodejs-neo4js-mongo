import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import pokemonController from './src/pokemonController';
import Battle from './src/models/battle';
import battleController from './src/battleController';

const app = express();
const PORT = 3000;
dotenv.config();

app.use(cors());
app.use(express.json());

app.get('/pokemon', async (req, res) => {
  try {
    const { limit = '10', offset = '-1' } = req.query;

    // Convierte los valores a números enteros
    const parsedLimit = parseInt(limit.toString(), 10);
    const parsedOffset = parseInt(offset.toString(), 10);

    const pokemonList = await pokemonController.listPokemon(parsedLimit, parsedOffset);

    res.json(pokemonList);
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.post('/pokemon', async (req, res) => {
  try {
    const { query, limit = 10, offset = -1 } = req.body;
    
    if (typeof query === 'string' || (typeof query === 'object')) {
      const pokemonList = await pokemonController.queryPokemon(query, limit, offset);
      res.json(pokemonList);
    } else {
      res.status(400).json({ message: 'Invalid request format' });
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.get('/pokemon/evolutions/:pid', async (req, res) => {
  try {
    const pid:number = parseInt(req.params.pid);

    const pokemonList = await pokemonController.getEvolutions(pid);

    res.json(pokemonList);
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.post('/simulate-battle', async (req, res) => {
  try {
    const { teamA = [0,0,0], teamB = [0,0,0]} = req.body;

    const pokemonResult = await pokemonController.simulateBattle(teamA, teamB);

    res.json(pokemonResult);
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.post('/find-strong-against', async (req, res) => {
  try {
    const { pid } = req.body;

    if (typeof pid === 'number' || typeof pid === 'object') {
      const pokemon = await pokemonController.findStrongAgainst(pid);
      res.json(pokemon);
    } else {
      res.status(400).json({ message: 'Invalid request format' });
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.post('/save-battle', async (req, res) => {
  try {
    const body:Battle = req.body;

    if (typeof body === 'object') {
      const result = await battleController.saveBattle(body);
      res.json(result);
    } else {
      res.status(400).json({ message: 'Invalid request format' });
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.post('/find-battle', async (req, res) => {
  try {
    const { date, playerA, playerB, winner, limit = -1, offset = 0 } = req.body;
    const findQuery: Partial<Battle> = {
      ...(date && { date }),
      ...(playerA && { playerA }),
      ...(playerB && { playerB }),
      ...(winner && { winner }),
    };

    if (typeof findQuery === 'object') {
      const result = await battleController.queryBattles(findQuery, limit, offset);
      res.json(result);
    } else {
      res.status(400).json({ message: 'Invalid request format' });
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error:error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
