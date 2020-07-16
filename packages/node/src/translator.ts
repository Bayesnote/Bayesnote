import { ICodeCell } from '@bayesnote/common/lib/types'
import { createContext, Script } from 'vm'

//TODO: Refactor
//TODO: Support Apache Arrow instead of JSON
//TODO: Drop js support, Spark

export type IJsonDataMap = {
    [key: string]: string // variableName: JSONDataString
}

export class Translator {
    toJSONDataMap(cell: ICodeCell) {
        // eg:
        // from: abc=[1,2,3] def={name: 'oliver'}
        // to: { abc: '[1, 2, 3]', def: '{"name": "oliver"}' }
        const { source: codeStr } = cell
        // prepare sandbox
        const sandbox = {
            __toJSON: function () {
                const jsonDataMap: IJsonDataMap = {}
                const variables = Object.entries(sandbox).filter((variable) => variable[0] !== '__toJSON')
                // variables except this function
                const _variables = variables.map((variable) => ({
                    name: variable[0],
                    value: variable[1],
                }))
                // translate types
                _variables.forEach((variable) => {
                    jsonDataMap[variable.name] = JSON.stringify(variable.value)
                })
                return jsonDataMap
            },
        }
        const ctx = createContext(sandbox)
        const script = new Script(codeStr + ';__toJSON()')
        // execute
        const jsonDataMap: IJsonDataMap = script.runInContext(ctx)
        return jsonDataMap
    }

    translateToJSONExportCode(
        sourceLanguage: string,
        kernelName: string,
        variable: string,
        tempVarName = 'temp_unified_notebook_var',
        opts: {
            scriptImportJSON: boolean
            scriptStringify: boolean
            scriptPrint: boolean
            scriptClean: boolean
        } = {
                scriptImportJSON: true,
                scriptStringify: true,
                scriptPrint: true,
                scriptClean: true,
            },
    ) {
        // It generate code that stringify data to json string
        // To avoid global scope pollution the tempVar will be removed
        let code = ''
        let scriptImportJSON
        let scriptStringify
        let scriptPrint
        let scriptClean

        if (['python'].includes(sourceLanguage) && kernelName.startsWith('python3')) {
            scriptImportJSON = `import json\n`
            scriptStringify = `${tempVarName} = json.dumps(${variable})\n`
            scriptPrint = `print(${tempVarName})\n`
            scriptClean = `del ${tempVarName}\n`
        } else if (['javascript'].includes(sourceLanguage)) {
            scriptImportJSON = ``
            scriptStringify = `${tempVarName} = JSON.stringify(${variable})\n`
            scriptPrint = `console.log(global.${tempVarName})\n`
            scriptClean = `delete global.${tempVarName}\n`
        } else if (sourceLanguage === "R") {
            scriptImportJSON = `library("rjson")\n`
            scriptStringify = `${tempVarName} = toJSON(${variable})`
            scriptPrint = ``
            scriptClean = ``
        } else if (sourceLanguage === "Scala" && ['apache_toree_scala'].includes(kernelName)) {
            scriptImportJSON = `import spark.implicits._\n`
            scriptStringify = `spark.read.json(Seq(jsonStr).toDS)`
            scriptPrint = ``
            scriptClean = ``
        } else {
            scriptImportJSON = `library("rjson")\n`
            scriptStringify = `fromJSON(${tempVarName})`
            scriptPrint = ``
            scriptClean = ``
        }
        opts.scriptImportJSON && (code += scriptImportJSON)
        opts.scriptStringify && (code += scriptStringify)
        opts.scriptPrint && (code += scriptPrint)
        opts.scriptClean && (code += scriptClean)
        return code
    }

    translateFromJSONImportCode(targetLanguage: string, kernelName: string, jsonData: string, varName: string) {
        console.log("translateToJSONExportCode", targetLanguage, kernelName)

        let code
        if (['python'].includes(targetLanguage) && kernelName.startsWith('python3')) {
            const importJSON = `import json\n`
            const parse = `${varName} = (json.loads('${jsonData.trim()}'))\n`
            code = `${importJSON}${parse}`
        } else if (['javascript'].includes(targetLanguage)) {
            const importJSON = ``
            const parse = `${varName} = JSON.parse('${jsonData.trim()}')\n`
            code = `${importJSON}${parse}`
        } else if (targetLanguage === "R") {
            const importJSON = `library("rjson")\n`
            const parse = `${varName} = (fromJSON('${jsonData.trim()}'))\n`
            code = `${importJSON}${parse}`
        } else if (targetLanguage === "Scala" && ['apache_toree_scala'].includes(kernelName)) {
            const importJSON = `import spark.implicits._\n`
            const parse = `val ${varName} = spark.read.json(Seq(${jsonData.trim()}).toDS)\n`
            code = `${importJSON}${parse}`
        } else {
            const importJSON = `library("rjson")\n`
            const parse = `${varName} = (toJSON('${jsonData.trim()}'))\n`
            code = `${importJSON}${parse}`
        }

        console.log("translateFromJSONImportCode", code)
        return code
    }
}
