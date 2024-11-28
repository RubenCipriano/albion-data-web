function parseLine(line) {
    const [id, item_name, name, item_quatity] = line.split(":");

    return {
        "id": id?.trim(),
        "item_name": item_name?.trim(),
        "name": name?.trim(),
        "item_quatity": parseInt(item_quatity?.trim()) || 1,
        "search": id.trim() + " " + item_quatity.trim() + " " + name.trim(),
    }
}

module.exports = { parseLine }