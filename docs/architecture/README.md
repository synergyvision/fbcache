## Estructura Interna

La librería FBCache internamente hace uso de otras librerías que ayudan a implementar la funcionalidad que ofrece esta librería, por ejemplo, el almacenamiento y manejo de la memoria caché, la conexión hacía un proyecto de Firebase, etc. Las librerías que se implementaron en FBCache fueron las siguientes:
- node-cache: Está librería se implementó para hacer el almacenamiento y manejo de todo lo relacionado con la memoria caché.
- firebase-admin: Librería oficial de Firebase para implementar los distintos servicios de esta plataforma en una aplicación enfocada a estar implementada del lado del servidor. Se usó para establecer la conexión a proyectos de Firebase y hacer las distintas operaciones CRUD hacía Firestore y Real Time Database.
- moment: Para las políticas de refrescamiento de la memoria caché, se necesitaba hacer manejo de fechas, entonces se decidió usar momento para facilitar el manejo de las fechas.
- uuid: Los registros que se guardan en caché a través de node-cache, se les tiene que asignar un ID con el cual la librería pueda almacenar distintos datos sin afectar a los otros, entonces, para asignar ese ID, se decidió usar esta librería para asegurar que el ID sea único, seguro y fácil de asignar.
Además de lo dicho anteriormente, FBCache se escribió usando ECMAScript 2016 y se usó Babel para transpilar el código escrito. Y para las pruebas E2E implementadas se usó jest.

## Uso de la librería

Se hizo un diseño inicial de los métodos de FBCache que brindaban una facilidad de uso y eran fáciles de implementar; sin embargo, durante el desarrollo de está, se vio que hacer una firma similar a la implementada por firebase-admin para hacer uso de sus métodos era una muy buna idea para adaptar con mayor facilidad a FBCache en proyectos donde se haya implementado firebase-admin; entonces, para aprovechar lo desarrollado bajo el antiguo diseño, se realizó una fachada, la cual implementa una firma muy similar a la de firebase-admin, pero implementa los métodos ya implementados en FBCache, por lo que el desarrollador que implemente FBCache, estará usando la fachada realizada, y esta es la que usará los métodos de la librería. Para ver esto de mejor manera, puede ver el diagrama que está junto a este archivo README.
