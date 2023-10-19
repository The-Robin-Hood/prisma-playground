import { Diagnostic } from "@codemirror/lint"
import { EditorView } from "@codemirror/view"
import { Text } from "@codemirror/state"

export const jsonParseLinter = () => (view: EditorView): Diagnostic[] => {
    try {
        if (view.state.doc.toString().trim() === '') return []
        JSON.parse(view.state.doc.toString())
    } catch (e) {
        if (!(e instanceof SyntaxError)) throw e
        const pos = getErrorPosition(e, view.state.doc)
        return [{
            from: pos,
            message: e.message,
            severity: 'error',
            to: pos
        }]
    }
    return []
}

function getErrorPosition(error: SyntaxError, doc: Text): number {
    let m
    if (m = error.message.match(/at position (\d+)/))
        return Math.min(+m[1], doc.length)
    if (m = error.message.match(/at line (\d+) column (\d+)/))
        return Math.min(doc.line(+m[1]).from + (+m[2]) - 1, doc.length)
    return 0
}