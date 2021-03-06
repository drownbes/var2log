#!/usr/bin/node

const recast = require('recast');
const types = require('ast-types');
const b = types.builders;
const n = types.namedTypes;

const readPipe = () => new Promise((resolve, reject) => {
  let code = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(data) {
    code += data;
  });
  process.stdin.on('end', () => {
    resolve(code);
  });
});

const writePipe = (data) => process.stdout.write(data)

const collectVars = (ast) => {
    let vars = [];
    types.visit(ast, {
        visitThisExpression: function(path) {
            vars.push(path.node);
            return false;
        },
        visitIdentifier: function(path) {
            vars.push(path.node);
            return false;
        },
        visitMemberExpression: function(path) {
            vars.push(path.node);
            return false;
        }
    });
    return vars;
};

const vars2console = (vars) => {
    const elems = vars.map(v => b.templateElement({raw:' ' + recast.prettyPrint(v).code + ': ', cooked: recast.prettyPrint(v).code}, false));
    const stmt = b.callExpression(
        b.memberExpression(b.identifier('console'), b.identifier('log')),
        [
            b.templateLiteral(elems, vars)
        ]
    );

    return stmt;
};

function run() {
    readPipe()
    .then(recast.parse)
    .then(collectVars)
    .then(vars => recast.prettyPrint(vars2console(vars), { quote: 'single', tabWidth: 2 }).code)
    .then((code) => console.log(code))
    .catch((e) => console.log(e.description + ':' + e.index));
}
run();
