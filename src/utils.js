export function isFunction(obj) {
    return Object.prototype.toString.call(obj) == '[object Function]';
}

export function nextUpdate(predicate) {
    return setTimeout(predicate, 0);
}

export function isObject(obj) {
    return obj != null && obj === Object(obj);
}

export function removeFromArray(array, item) {
    var again = true;
    while (again) {
        var index = array.indexOf(item);
        if (index != -1) {
            array.splice(index, 1);
        } else {
            again = false;
        }
    }
}