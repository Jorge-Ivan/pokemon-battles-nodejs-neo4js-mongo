# Aplicación - Pokemon API
La API Pokemon es una plataforma diseñada para interactuar con una base de datos que contiene información detallada sobre diferentes Pokémon. Permite realizar diversas consultas y operaciones relacionadas con los Pokémon, las batallas simuladas y las evoluciones.

## Requisitos Previos

1. **Entorno de Desarrollo:**
   - Asegúrate de tener un entorno de desarrollo configurado con Node.js instalado en tu sistema.

2. **Instalación de Dependencias:**
   - Abre una terminal en la raíz del proyecto.
   - Ejecuta el comando `npm install` para instalar todas las dependencias necesarias.

3. **Variables de Entorno:**
   - Asegúrate de haber configurado correctamente las variables de entorno (como .env) para las credenciales y las URL de la base de datos, si es necesario.
   - La aplicación usa MongoDB y Neo4j:
     - MongoDB para guardar las batallas.
     - Neo4j para consultar datos sobre los Pokemon

### Ejecución de la Aplicación

Una vez que has configurado todo lo necesario, puedes iniciar la aplicación ejecutando los siguientes comandos desde la terminal:

1. **Para Ejecutar en Modo de Desarrollo:**
   - Ejecuta `npm run start:dev`.
   - Esto iniciará la aplicación en modo de desarrollo. La aplicación se reiniciará automáticamente cuando realices cambios en el código.

2. **Para Ejecutar en Modo de Producción:**
   - Ejecuta `npm start`.
   - Esto iniciará la aplicación en modo de producción.

### Acceso a la Aplicación

Una vez que la aplicación esté en funcionamiento, podrás acceder a ella a través de un navegador web o utilizando herramientas como Postman para enviar solicitudes a los diferentes endpoints según la documentación proporcionada anteriormente.

Por ejemplo, para acceder a la lista de Pokémon, puedes usar el siguiente enlace en tu navegador:

`http://localhost:3000/pokemon?offset=1&limit=10`

Recuerda reemplazar `localhost` y `3000` por la dirección y el puerto correspondiente si has configurado valores diferentes.

Estos pasos te permitirán ejecutar la aplicación y acceder a sus diferentes funcionalidades según la configuración establecida en el entorno de desarrollo.

## API Pokemon

#### List pokemon

- **Método**: GET
- **URL**: `http://localhost:3000/pokemon?offset=1&limit=10`

#### Query Pokemon

- **Método**: POST
- **URL**: `http://localhost:3000/pokemon`
- **Body**:
  ```json
  {
      "query": "Bulbasaur",
      "limit": 1,
      "offset": 0
  }
  ```

#### Evolutions Pokemon

- **Método**: GET
- **URL**: `http://localhost:3000/pokemon/evolutions/1`

#### Simulate Battle

- **Método**: POST
- **URL**: `http://localhost:3000/simulate-battle`
- **Body**:
  ```json
  {
      "teamA": [1,56,876],
      "teamB": [4,45,600]
  }
  ```

#### Find Strong Against

- **Método**: POST
- **URL**: `http://localhost:3000/find-strong-against`
- **Body**:
  ```json
  {
      "pid" : [8,45,500]
  }
  ```

#### Save Battle

- **Método**: POST
- **URL**: `http://localhost:3000/save-battle`
- **Body**:
  ```json
  {
      "date": 879898887778,
      "playerA": "Brent",
      "playerB": "Sam",
      "teamA": [1, 2, 3],
      "teamB": [4, 5, 6],
      "resultado": [-1, -1, -1],
      "winner": "B"
  }
  ```

#### Find Battle

- **Método**: POST
- **URL**: `http://localhost:3000/find-battle`
- **Body**:
  ```json
  {
      "date": 879898887778,
      "playerA": "Brent",
      "playerB": "Sam",
      "winner": "B",
      "limit": 1,
      "offset": 1
  }
  ```

## Creación de Datos Pokémon y Relaciones en Neo4j

### Carga de Datos

1. **Cargar Datos Principales de Pokémon:**
   ```cypher
   CALL apoc.load.json("https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json")
    YIELD value
    MERGE (p:Pokemon {id: value.id, name: value.name.english,description: value.description, hires: COALESCE(value.image.hires, ''), thumbnail: COALESCE(value.image.thumbnail, ''), sprite: COALESCE(value.image.sprite, '')})
    
    WITH p, value
    UNWIND value.type AS typePk
    MERGE (c:Type {name: typePk})
    MERGE (p)-[:Has]->(c)
    
    MERGE (s:Specie {name: value.species})
    MERGE (p)-[:Is]->(s)
    
    WITH p, value
    UNWIND value.profile.egg AS egg
    MERGE (e:Egg {name: egg})
    MERGE (e)-[:Born_Of]->(p)
    
    WITH p, value
    UNWIND value.profile.ability AS ability
    MERGE (a:Ability {name: ability[0]})
    MERGE (p)-[:Has {learned: ability[1]}]->(a)
   ```
   
2. **Cargar Datos Evoluciones de Pokémon:**
   ```cypher
   CALL apoc.load.json("https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json")
    YIELD value 
    MATCH (p:Pokemon {id: value.id})
    
    UNWIND value.evolution.next as next
    MATCH (p2:Pokemon {id: toInteger(next[0])})
    MERGE (p)-[:Evolution_Next {level:next[1]}]->(p2)
   ```

   ```cypher
   CALL apoc.load.json("https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json")
    YIELD value 
    MATCH (p:Pokemon {id: value.id})
    where NOT isEmpty(value.evolution.prev)
    
    MATCH (p2:Pokemon {id: toInteger(value.evolution.prev[0])})
    MERGE (p)-[:Evolution_Prev {level:value.evolution.prev[1]}]->(p2)
   ```
   
3. **Cargar Datos Efectividad de Pokémon (ataques):**
   ```cypher
    CALL apoc.load.json("https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/types.json")
    YIELD value
    MATCH (t:Type {name:value.english})
    
    WITH t, value
    UNWIND value.effective as effective
    MATCH (t2:Type {name:effective})
    MERGE (t)-[:Effective]->(t2)
    
    WITH t, value
    UNWIND value.ineffective as ineffective
    MATCH (t3:Type {name:ineffective})
    MERGE (t)-[:Ineffective]->(t3)
    
    WITH t, value
    UNWIND value.no_effect as no_effect
    MATCH (t4:Type {name:no_effect})
    MERGE (t)-[:No_Effect]->(t4)
   ```
---

## Derechos de Autor

© 2023 Jorge Ivan Carrillo

Este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT). Puedes usar, modificar y distribuir este software de acuerdo con los términos de la licencia.

Autor: [Jorge Ivan Carrillo](https://linkedin.com/in/jorgecarrillog/)

**Ten en cuenta que el contenido de los datos importados tiene derechos de autor de Pokémon Company y sus afiliados.**

Este repositorio usa una recopilación de datos recopilados de fuentes como [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Main_Page) and [pokemondb.net](https://pokemondb.net) y el repositorio [Pokemon.json](https://github.com/Purukitto/pokemon-data.json)

---
