# Bayesnote-cli

```sh
cd /path/to/Bayesnote/cli
yarn run build
yarn link
```

```
ls ~/.config/yarn/link
bayesnote-cli
```

## Run notebook

The sample notebook JSON file is in the test folder.

**makesure you have started the node application**

```sh
bayesnote run <path/to/notebook/json/file>
```

example:

```sh
# run notebook without parameter
bayesnote run code-notebook.json
```

## Run notebook with parameters

```sh
bayesnote run -p <parameter> -p <parameter> <path/to/notebook/json/file>
```

**parameter is a `key=value` string**

example:

```sh
# run notebook with parameters
bayesnote run -p "myList=[1,2,3]" -p "delay=0" parameter-notebook.json
```

## Injected-parameter cell

- Has parameter cell and no injected-parameter cell:
    - Add injected-parameter cell after the first parameter cell
- Has parameter cell and has injected-parameter cell:
    - Replace the first injected-parameter cell
- Has no parameter cell and has injected-parameter cell:
    - Replace the first injected-parameter cell
- Has no parameter cell and no injected-parameter cell:
    - Add injected-parameter cell before the first cell
