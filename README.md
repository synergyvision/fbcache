# FBCache

![node version](https://img.shields.io/badge/node-12.18.3-green)

![firebase-admin version](https://img.shields.io/badge/firebase-admin-9.1.1-blue)
![node-cache version](https://img.shields.io/badge/node-cache-5.1.2-blue)
![moment](https://img.shields.io/badge/moment-2.27.0-blue)
![uuid](https://img.shields.io/badge/uuid-8.3.0-blue)

## Instalación

npm install git://github.com/synergyvision/fbcache.git#master --save

## Inicialización de FBCache

```
import { initFBCache } from 'fbcache';
import * as config from "./fbcache.config.json";

initFBCache(config, projectURL, credentialType, credential);

```

fbcache.config.json, es un archivo que contendrá un objeto con las configuraciones que se le quieran dar a la librería, para conocer acerca de este archivo haz click [aquí](https://github.com/synergyvision/fbcache/issues/5)

_projectURL_ es el URL al projecto de Firebase en donde se encuentren los childs de Real Time Database y/o las colecciones de Firestore

_credentialType_ indica el tipo de credencial con la que se quiere autenticar a Firebase, ya sea con un token OAuth, o con un archivo de credenciales generado desde Firebase, los valores que puede recibir este método son "token" y "file"

_credential_ es la credencial con la que se quiere autenticar a Firebase, puede recibir un string con un token OAuth, un string con la ruta al archivo de credenciales .json generado por Firebase, o directamente el objeto de dicho archivo. Para pasar el string con el token se debe a _credentialType_ el valor "token", para el string del archivo o el objeto se debe pasar a _credentialType_ el valor "file"

## Métodos

FBCache usa una firma similar a la que implementa _firebase-admin_, por lo que si ya has utilizado antes esta librería te adaptaras facilmente a FBCache. Para hacer una instancia de FBCache puedes realizar lo siguiente:

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
```

ya con esta instancia puedes empezar a implementar la librería

### Consulta a Real Time Database

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.database().ref(name).once();
```

- Parámetros
  - name (string): Nombre del child a consultar en Real Time Database

- Respuesta
Este método retornará un objeto con las siguientes características
```
{
    data: Información extraida de Real Time Database,
    fromCache: Boolean que indica si se realizo la consulta con la información en caché (true) o si no (false),
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

### Consulta a Firestore

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.firestore().collection(name).get();
```

- Parámetros
  - name (string): Nombre de la colección a consultar en Firestore

- Respuesta
Este método retornará un objeto con las siguientes características
```
{
    data: Información extraida de Firestore,
    fromCache: Boolean que indica si se realizo la consulta con la información en caché (true) o si no (false),
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

### Inserta datos a Real Time Database

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.database().ref(name).child(id).set(insertData);
```

- Parámetros
  - name (string): Nombre del child a donde se vaya a realizar la inserción
  - insertData (object): Objeto con la información a insertar
  - id (string || number): Indica el id con el que se quiera guardar la información en Real Time Database

- Respuesta
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción en un child indicado en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```
**NOTA**: Al usar este método se puede dar el caso de que al mismo tiempo se haga la inserción de 2 objetos con el mismo id, por lo que, una puede reescribir a la otra, para evitar esto, intente insertar usando el siguiente método:

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.database().ref().child(route).push(insertData);
```

Usando este método, Real Time Database asigna un ID único a la información que se esté insertando, haciendo que se evite sobreescribir la información de otro registro que se encuentre almacenado

### Inserta datos a Firestore

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.firestore().collection(name).doc(id).set(insertData);
```

- Parámetros
  - name (string): Nombre de la colección a donde se vaya a realizar la inserción
  - insertData (object): Objeto con la información a insertar
  - id (string || number): Indica el id con el que se quiera guardar la información en Firestore

- Respuesta
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción a una colección indicada en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```
**NOTA**: Al usar este método se puede dar el caso de que al mismo tiempo se haga la inserción de 2 objetos con el mismo id, por lo que, una puede reescribir a la otra, para evitar esto, intente insertar usando el siguiente método:

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.firestore().collection(name).add(insertData);
```

Usando este método, Firestore asigna un ID único a la información que se esté insertando, haciendo que se evite sobreescribir la información de otro registro que se encuentre almacenado

### Actualiza datos en Real Time Database

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.database().ref(name).child(id).update(updateData);
```

- Parámetros
  - name (string): Nombre del child a donde se vaya a realizar la inserción
  - updateData (object): Objeto con la información que se quiere insertar para actualizar los registros
  - id (string || number): Indica el id con el que se quiera actualizar la información en Real Time Database

- Respuesta:
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción a un child indicado en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

### Actualiza datos en Firestore

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.firestore().collection(name).doc(id).update(updateData)
```

- Parámetros
  - name (string): Nombre de la colección a donde se vaya a realizar la inserción
  - updateData (object): Objeto con la información que se quiere insertar para actualizar los registros
  - id (string || number): Indica el id con el que se quiera actualizar la información en Firestore

- Respuesta:
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción a una colección indicada en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

### Elimina datos en Real Time Database

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.database().ref(name).child(id).remove();
```

- Parámetros
  - name (string): Nombre del child donde se realizará la eliminación
  - id (string || number): Indica el id que se quiere eliminar en Real Time Database

- Respuesta:
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una eliminación a un child indicado en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

### Elimina datos en Firestore

```
import { FBCache } from 'fbcache';

let fbc = new FBCache();
let resp = await fbc.firestore().collection(name).doc(id).delete();
```

- Parámetros
  - name (string): Nombre de la colección donde se realizará la eliminación
  - id (string || number): Indica el id que se quiere eliminar en Firestore

- Respuesta:
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una eliminación a una colección indicada en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```
