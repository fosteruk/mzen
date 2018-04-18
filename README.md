# mZen
## NodeJS application model with MongoDB

mZen is a small NodeJS module that provides functionality for implementing an application model using MongoDB for persistence.

mZen can be used in any type application, server-side, client-app or as a REST API. [mZen-Server](https://github.com/kevin-foster/mZen-Server) is a separate NodeJS module that exposes an mZen model as a REST API server.

- Model elements are separated into Schemas, Services and Repositories
  - Schemas are objects that define your data structures and validation rules
  - Repositories are responsible for persisting data
    - Data saved and retrieved from the database via repositories
    - Each repository has a schema which defines it data structure
    - Repositories can define relations between each other (one-many, many-to-many etc)
    - Services use repositories to save and load entities
  - Services handle interaction between (checkout, authenticator, report-generator, email)
- Schema
  - Validation
  - Type-casting
- Object Document Mapping (ODM)
  - Populate documents into constructor instances (e.g instance of an ES6 class)
  - Populate document relations

- Document relation population
  - Common relations supported
    - hasOne
    - hasMany
    - hasManyCount (count of the number of matching related documents)
    - belongsToOne
    - belongsToMany (many-to-many using an embedded reference array)
  - Optimised to minimise queries. One query per relation. Even when populating a collection
    - When the populate query uses the limit option, population is performed with one query per document to ensure results are as expected
  - Relations may be configured to auto-populate allowing a complex reference tree to be loaded with minimum code
    - Population of relations (and nested relations) may be enabled/disabled in query options
  - Relations may be auto-populated from initial query or manually populated on to an existing result set

- Data validation and type-casting
  - Define document structure as a set of fields and embedded documents
  - Built-in validators
    - required
      - field must be present
    - notNull
    - notEmpty
    - length (min/max)
    - regex
    - equality (must be equal to another field in the same object)
    - email
  - Supports custom validators
  - Specify default values
    - Default value is used when validating, inserting or updating a field with an undefined or null value
  - Type-casting
    - When field type is configured, value is cast to the required type on validation, insert or update
    - Cast failure produces a validation error
      - For example: casting the string 'three' to type number would produce NaN resulting in a validation error
    - Supported types
      - string
      - number
      - boolean
      - Date
      - ObjectID (BSON/MongoDB)
