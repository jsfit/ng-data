# angular-jsdata-generator

## Installation
Run `npm i -g angular-jsdata-generator` 

## Code scaffolding

Run `ngdata model` press enter to generate a new model in angular project.<br />
i)   it will prompt for model name<br />
ii)  prompt for  property/attribute and property type e.g string, number etc.<br />
iii) after entering all the properties, to finish the model just enter `without typing any property name` <br />
iv)  done, enjoy !<br />

# Remove model

Run `ngdata d model "model name"` remove a model<br />
e.g `ngdata d model user`<br />

## Usage

in which component you want to use just import STORE <br />
`import { STORE } from 'models/store';`<br />
<br />
Do all operations using `STORE` Like<br />
<br />
  `STORE`<br />
    `.findAll("user")`<br />
    `.then(function(users) {`<br />
      `   STORE.add("user", users);`<br />
    `});`<br />
## Full documentation status
Pending<br />
not documented yet.

## Further help

To get more help on the js-data out the [js-data docs](https://www.js-data.io/docs/working-with-the-datastore).
