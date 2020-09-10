# FBCache

## Instalación

npm install git://github.com/synergyvision/fbcache.git#master --save

## Inicialización:

```
const module = require('fbcache')

const FBCache = module.FBCache
```

- Si utiliza ECMAScript 6, puede realizarse de la siguiente forma

```
import { FBCache } from 'fbcache'
```

## Inicialización de FBCache

```
import { FBCache } from 'fbcache';
import * as config from "./fbcache.config.json";

FBCache.init(config, projectURL, credentialType, credential);

```

fbcache.config.json, es un archivo que contendrá un objeto con las configuraciones que se le quieran dar a la librería, para conocer acerca de este archivo haz click [aquí](https://github.com/synergyvision/fbcache/issues/5)

_projectURL_ es el URL al projecto de Firebase en donde se encuentren los childs de Real Time Database y/o las colecciones de Firestore

_credentialType_ indica el tipo de credencial con la que se quiere autenticar a Firebase, ya sea con un token OAuth, o con un archivo de credenciales generado desde Firebase, los valores que puede recibir este método son "token" y "file"

_credential_ es la credencial con la que se quiere autenticar a Firebase, puede recibir un string con un token OAuth, un string con la ruta al archivo de credenciales .json generado por Firebase, o directamente el objeto de dicho archivo. Para pasar el string con el token se debe a _credentialType_ el valor "token", para el string del archivo o el objeto se debe pasar a _credentialType_ el valor "file"

## Métodos

### Consulta a Real Time Database o Firestore

```
FBCache.get( dbms, name, conditions )
```

- Parámetros
  - dbms (string): Nombre del manejador de base de datos a donde se vaya a consultar
  - name (string): Nombre del child o colección a consultar
  - conditions (object): Condiciones que se quieran aplicar para que saber que registros se retornan y cuales no (OPCIONAL) (si no se especifican condiciones, se retornan todos los registros almacenados)

**NOTA**: La estructura del objeto conditions se esta definiendo todavía

- Respuesta
Este método retornará un objeto con las siguientes características
```
{
    data: Array con los datos solicitados,
    fromCache: Boolean que indica si se realizo la consulta con la información en caché (true) o si no (false),
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

- Ejemplo
```
FB.Cache.get( 'Firestore', 'users' );

return
{ 
    data: [ { id: 1, name: "user_1" }, { id: 2, name: "user_2" } ],
    fromCache: false,
    updateCache: true
}
```

### Inserta datos a Real Time Database o Firestore

```
FBCache.set( dbms, name, insertData )
```

- Parámetros
  - dbms (string): Nombre del manejador de base de datos a donde se vaya a insertar
  - name (string): Nombre del child o colección a donde se vaya a realizar la inserción
  - insertData (object): Objeto con la información a insertar

- Respuesta
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción a una colección o child indicado en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

- Ejemplo:
```
FBCache.set( 'Real Time Database', 'persons', { name: "Name", lastname: "Lastname" })

return:
{
    routeInConfig: true
    updateCache: true
}
```

### Actualiza datos en Real Time Database o Firestore

```
FBCache.set( dbms, name, updateData, conditions )
```

- Parámetros
  - dbms (string): Nombre del manejador de base de datos a donde se vaya a actualizar la información
  - name (string): Nombre del child o colección a donde se vaya a realizar la inserción
  - updateData (object): Objeto con la información que se quiere insertar para actualizar los registros
  - conditions (object): Condiciones que se quieran aplicar para que saber que registros se actualizan y cuales no (OPCIONAL) (si no se especifican condiciones, se actualizan todos los registros almacenados)

**NOTA**: La estructura del objeto conditions se esta definiendo todavía

- Respuesta:
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción a una colección o child indicado en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

- Ejemplo:
```
FBCache.update( 'Real Time Database', 'persons', { name: "Name", lastname: "Lastname" } )

return:
{
    routeInConfig: true
    updateCache: true
}
```

### Elimina datos en Real Time Database o Firestore

```
FBCache.delete( dbms, name, conditions )
```

- Parámetros
  - dbms (string): Nombre del manejador de base de datos a donde se vaya a eliminar
  - name (string): Nombre del child o colección donde se realizará la eliminación
  - conditions (object): Condiciones que se quieran aplicar para que saber que registros se eliminan y cuales no (OPCIONAL) (si no se especifican condiciones, se eliminan todos los registros almacenados)

**NOTA**: La estructura del objeto conditions se esta definiendo todavía

- Respuesta:
Este método retornará un objeto con las siguientes características
```
{
    routeInConfig: Boolean que indica si se realizo una inserción a una colección o child indicado en el archivo de configuración (true) o si no (false)
    updateCache: Boolean que indica si se realizo una actualización de la información en caché (true) o si no (false)
}
```

- Ejemplo:
```
FBCache.delete( 'Firestore', 'users' )

return:
{
    routeInConfig: true
    updateCache: true
}
```
## Enum _service_

Para evitar errores en la escritura del nombre del manejador de base de datos en los métodos de la librería, esta pone a disposición el enum _service_, que permite obtener el nombre de los manejadores de base de datos sin necesidad de pasar el nombre como un string.

### Estructura de _service_

service = {
    FIRESTORE: 'Firestore',
    REAL_TIME: 'Real Time Database'
}

### Uso de _service_

```
const module = require('fbcache')

const FBCache = module.FBCache;
const service = module.service
```

- Si utiliza ECMAScript 6, puede realizarse de la siguiente forma
```
import { FBCache, service } from 'fbcache'
```

- Ejemplo de la implementación

```
FBCache.get( service.FIRESTORE, 'users' );
FBCache.get( service.REAL_TIME, 'users' );
```
