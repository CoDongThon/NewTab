function html(strings, ...values) {
    const template = document.createElement('template');
    template.innerHTML = strings.reduce((result, string, i) => {
        return result + string + (values[i] || '');
    }, '');
    return template.content.firstElementChild;
}
export default html;