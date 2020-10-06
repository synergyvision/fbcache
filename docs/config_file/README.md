# Archivo de configuración

## Estructura general del archivo de configuración:

```
{
    read_only: boolean,    
    firestore: Array[object],
    realtime: Array[object],
    max_size: string,
}
```

## Atributos del archivo de configuración

- **read_only**: Es un boolean que indica si las rutas hacía Firestore o Real Time se les puede hacer operaciones de escritura (ya sean operaciones de inserción, actualización o eliminación); si se indica como _false_, se podrán hacer operaciones de escritura, si se indica como _true_ no se podrán hacer. En caso que no se indique este atributo, se tomará por defecto como si se hubiera indicado el valor _true_
**NOTA**: Esta sería una configuración general, se seguirá lo que indique este atributo en caso de que se haga una operación de escritura en una ruta no indicada en los atributos "firestore" o "realtime", en las rutas indicadas se puede definir un "read_only" especifico para estás, por lo que en caso de que se defina, en esa ruta se seguirá lo que diga su politica de escritura especifica, de lo contrario tambien seguirá la politica general

- **max_size**: Es un string que indica el limite que se quiera dar al almacenamiento en memoria caché, el formato del string que aquí se indique debe ser "X Y", donde la X indica la cantidad y la Y la unidad que se quiera utilizar, es decir, si se quiere establecer un limite de 50 MB, el string debe tener la siguiente forma "50 MB", las unidades que se le pueden indicar al atributo "max_size" son B (bytes), kB (kilobytes), MB (megabytes). En caso de que el almacenamiento en caché ocupe más espacio del que se indica, la librería evitará cualquier actualización en de lo almacenado en memoria caché hasta que se borre parte de la información almacenada que permita volver a cumplir con lo establecido por este atributo. En caso de no indicarse, no habrá limite en lo que se pueda almacenar en caché

- **firestore** y **realtime**: Ambos son unos arreglos en donde se indicarán las rutas hacía Firestore o Real Time Database a las cuales se le quiere realizar un almacenamiento en caché, en estos Array se guardarán objetos que tengan la ruta que se quiere indicar más la configuración de la caché, los objetos que se pueden incluir en estos arreglos deben tener la siguiente estructura:

```
{
    name: string,
    refresh: string,
    period: string,
    start: string,
    read_only: boolean
}
```
**NOTA**: Los atributos refresh y period indican la politica de refrescamiento que va a tener la memoria caché, por ende no se pueden definir al mismo tiempo, lea más abajo la funcionalidad de cada uno para saber cuando definir refresh y cuando definir period

Los atributos de estos objetos tienen las siguientes funcionalidades:

- **name**: String que indica la ruta a la que se le quiere hacer un almacenamiento en caché, si el objeto se encuentra dentro del array "firestore" se entiende que este nombre es el de una colección en Firestore, si por el contrario esta en el array "realtime" se entiende que este es el nombre de un child de Real Time Database

- **refresh** y **period**: Ambos son un string que indican cada cuanto se quiere actualizar la información que se encuentre en la memoria caché de la ruta en donde están definidos, la única diferencia entre ambos es que cada uno define una politica de refresacamiento distinta.

"refresh" usa una politica más permisiva que asigna el tiempo de vigencia de la información de manera constante, es decir, si defines que el tiempo de vigencia sea de 2 minutos usando refresh, en lo que se guarde en caché, esa información será accedible por los siguientes 2 minutos, cuando la información deje de estar vigente, se espera a que se realice la siguiente consulta para actualizar lo que esté en caché, y se le asignan 2 minutos de vigencia, independientemente de cuando se haga esa consulta. En pocas palabras, refresh hace que siempre que se actualice la caché, asigna siempre una cantidad de tiempo fija sin importar cuando se realiza esa actualización

"period" por su parte usa una politica más estricta, este se apoya junto al atributo "start" para poder funcionar, más abajo está el detalle del atributo "start", para este momento nos basta con saber que "start" nos indica el inicio del periodo de tiempo que se quiere seguir para actualizar la caché, esta politica establece que el tiempo de vigencia de la información que se guarde en caché va a depender del periodo de tiempo que se determine con estos 2 atributos, por ejemplo, se si se determina que periodo inicia el 02/10/2020 a las 06:00 pm, y el atributo "period" indique que la información se actualice cada 5 minutos, si se hace una consulta a las 06:03 pm, para determinar el tiempo de vigencia que tendrá dicha información, se irá sumando la cantidad de tiempo que indique "period" a lo indicado en "start", hasta que se consiga el punto donde la información debería vencerse según el periodo, en este caso, a las 06:05 pm, entonces, a la información que se guarde en caché se le asigna 2 minutos de vigencia para que a las 06:05 pm pierda vigencia y se tenga que actualizar.

"refresh" y "period" al hacer cumplir la misma función pero usando una politica de refrescamiento distinta, no se pueden definir al mismo tiempo en un mismo objeto; pero si se puede tener varias rutas con distintas politicas de refrescamiento.

El formato de del string que se asigne a "refresh" o a "period" de cumplir con un formato "X Y", en donde X es la cantidad y Y la unidad de tiempo que se quiera asignar (ejemplo, para asignar un refrescamiento de 2 minutos, se asignaria "2 m"). Las unidades que se pueden asignar en Y son las siguientes: _s_ para segundos, _m_ para minutos, _h_ para horas, _d_ para días, _w_ para semanas y _M_ para meses, esto es ya que para el manejo de fechas nos apoyamos en la librería moment, para saber más de las unidades que se pueden usar, vea esta parte de la documentación de [moment](https://momentjs.com/docs/#/manipulating/add/)

- **start**: Este atributo se define junto a "period" para complementar la politica de refrescamiento por periodo, este atributo es un string que define el momento exacto en el que inicia el periodo de refrescamiento, el string debe tener el siguiente formato "YYYY-MM-DD hh:mm:ss a" (ejemplo del formato: "2020-10-02 06:00:00 pm")