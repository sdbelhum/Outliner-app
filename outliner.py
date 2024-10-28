from flask import Flask, request, jsonify, abort, Response

app = Flask(__name__)

# Outline class to represent the outline
# The outline is a tree structure where each node has a name and a list of children
# The root outline is the top level node
# Each node can have any number of children
class Outline:
    def __init__(self, parent=None):
        self.name = "outline"
        self.items = []
        self.parent = parent

    def add_item(self, parent):
        new_item = Outline(parent)
        self.items.append(new_item)
        return new_item

    def get_items(self):
        return self.items

    def delete_item(self, index):
        if index < len(self.items):
            self.items.pop(index)
        else:
            return -1

    def edit_name(self, new_name):
        self.name = new_name

    def get_name(self):
        return self.name
    
    def get_parent(self):
        return self.parent

# Create the root outline
root = Outline()

# finds the item at the given path
# this function was created using chatGPT and is modified to work with the Outline class
# "Given this class, how can I create a function that will convert a path like /outline/1/2/3/ into giving me the correct indexed object"
# path is a string of indices separated by slashes
def find_item(root, path):
    path_indices = [int(idx) for idx in path.split('/')]
    current = root
    for index in path_indices:
        if index < len(current.get_items()):
            current = current.get_items()[index]
        else:
            return None
    return current

# This api endpoint was created using chatGPT
# "How can i write an API with this model to return url, name, and children?"
# Accessed on October 26, 2024
# It gets the root outline
# Used as a reference to base other APIs off of
# Returns the root outline
@app.route("/outline/", methods=["GET"])
def get_outline():
    return jsonify({
        "url": "/outline/",
        "name": root.get_name(),
        "children": [f"/outline/{index}/" for index in range(len(root.get_items()))]
    }), 201

# Inspired by the get_outline function
# Returns the item at the given path
@app.route("/outline/<path:item_path>/", methods=["GET"])
def get_item(item_path):
    item = find_item(root, item_path)
    if item:
        return jsonify({
            "url": f"/outline/{item_path}/",
            "name": item.get_name(),
            "children": [f"/outline/{item_path}/{index}/" for index in range(len(item.get_items()))]
        }), 201
    else:
        return abort(404, "Item not found")

# Inspired by the get_outline function
# Creates a new item under the root outline
@app.route("/outline/", methods=["POST"])
def create_root_item():
    new_item = root.add_item(root)
    new_item_id = len(root.get_items()) - 1
    return jsonify({
        "url": f"/outline/{new_item_id}",
        "name": new_item.get_name(),
        "children": new_item.get_items()
    }), 201

# Inspired by the get_item function
# Creates a new item under the item at the given path
@app.route("/outline/<path:item_path>/", methods=["POST"])
def create_item(item_path):
    parent = find_item(root, item_path)
    if parent:
        new_item = parent.add_item(parent)
        new_item_id = len(parent.get_items()) - 1
        return jsonify({
            "url": f"/outline/{item_path}/{new_item_id}",
            "name": new_item.get_name(),
            "children": new_item.get_items()
        }), 201
    else:
        return abort(404, "Item not found")

# Inspired by the get_item function
# Edits the root item name
@app.route("/outline/", methods=["PUT"])
def edit_root_item():
    new_name = request.json.get('name', None)
    if new_name:
        root.edit_name(new_name)
        return jsonify({
            "name": root.get_name()
        }), 201
    else:
        abort(400, "Invalid input")

# Inspired by the get_item function
# Edits the item name at the given path
@app.route("/outline/<path:item_path>/", methods=["PUT"])
def edit_item(item_path):
    item = find_item(root, item_path)
    if item:
        new_name = request.json.get('name', None)
        if new_name:
            item.edit_name(new_name)
            return jsonify({
                "name": item.get_name(),
            }), 201
        else:
            abort(400, "Invalid input")
    else:
        abort(404, "Item not found")

# Inspired by the get_item function
# Deletes the item at the given path
@app.route("/outline/<path:item_path>/", methods=["DELETE"])
def delete_item(item_path):
    item = find_item(root, item_path)
    if item:
        parent = item.get_parent()
        if parent:
            remove_index = parent.get_items().index(item)
            parent.delete_item(remove_index)
            return "", 204
        else:
            abort(400, "Invalid input")
    else:
        abort(404, "Item not found")

# serve the UI
@app.route("/")
def serve_ui():
    with open("ui.html", "rb") as f:
        return Response(f.read(), mimetype="text/html")
# serve the css
@app.route("/style.css")
def serve_css():
    with open("style.css", "rb") as f:
        return Response(f.read(), mimetype="text/css")
# serve the js
@app.route("/main.js")
def serve_js():
    with open("main.js", "rb") as f:
        return Response(f.read(), mimetype="application/javascript")
# serve the edit icon
@app.route("/favicon.ico")
def serve_favicon():
    with open("favicon.ico", "rb") as f:
        return Response(f.read(), mimetype="image/x-icon")
# serve the add icon
@app.route("/faviconadd.ico")
def serve_favicon_add():
    with open("faviconadd.ico", "rb") as f:
        return Response(f.read(), mimetype="image/x-icon")
# serve the delete icon
@app.route("/faviconsub.ico")
def serve_favicon_sub():
    with open("faviconsub.ico", "rb") as f:
        return Response(f.read(), mimetype="image/x-icon")

if __name__ == "__main__":
    app.run(debug=True)