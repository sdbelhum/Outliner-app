'use strict';

// Define the Outline class
// This class represents an outline item in the UI
// It recieves its data from the API and creates the UI elements to display it
class Outline {

    constructor(url, name, parent = null) {
        this.url = url;
        this.name = name;
        this.items = [];
        this.parent = parent;

        // Create the view for the outline item
        this.view = this.createView();
        this.nameView = this.view.querySelector(".item-name");
        this.childrenContainer = this.view.querySelector(".children-container");
        this.editButton = this.view.querySelector(".edit-button");
        this.deleteButton = this.view.querySelector(".delete-button");
        this.addButton = this.view.querySelector(".add-button");
        
    }

    // Create the view for the outline item
    createView() {
        const outlineContainer = document.createElement("div");
        outlineContainer.className = "outline-item";

        // Create a container for the name and buttons
        const headerContainer = document.createElement("div");
        headerContainer.className = "header-container";
        outlineContainer.appendChild(headerContainer);

        // Create name element
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = this.name;  // Set initial value to the current name
        nameInput.className = "item-name-input";
        headerContainer.appendChild(nameInput);

        // Create button for deleting
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        // Add the image icon to the button
        const deleteIcon = document.createElement("img");
        deleteIcon.src = "/faviconsub.ico";
        deleteIcon.alt = "Delete";
        deleteIcon.className = "delete-icon";
        deleteButton.appendChild(deleteIcon);
        // Append the delete button to the header container
        headerContainer.appendChild(deleteButton);

        // Create button for adding
        const addButton = document.createElement("button");
        addButton.className = "add-button";
        // Add the image icon to the button
        const addIcon = document.createElement("img");
        addIcon.src = "/faviconadd.ico";
        addIcon.alt = "Add";
        addIcon.className = "add-icon";
        addButton.appendChild(addIcon);
        // Append the add button to the header container
        headerContainer.appendChild(addButton);

        // Create the children container
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "children-container";
        outlineContainer.appendChild(childrenContainer);

        
        deleteButton.addEventListener("click", async () => {
            try {
                await this.deleteItem(); // Delete the current item
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        });
        
        // Listen for clicks on the add button to add a new item
        addButton.addEventListener("click", async () => {
            try {
                await this.addItem(); // Add a new item to the outline
            } catch (error) {
                console.error("Error adding item:", error);
            }
        });
        
        // Listen for changes in the input to update the name
        nameInput.addEventListener("input", async () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== this.name) {
                try {
                    await this.editItem(newName); // Update name on the server
                } catch (error) {
                    console.error("Error updating name:", error);
                }
            }
        });

        return outlineContainer;
    }
    // This fetchOutline method was made inspired by the following video:
    // https://www.youtube.com/watch?v=fkeoyreOf-o
    // And the following documentation:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    // Accessed: October 26, 2024
    // It also inspires the addItem, editItem, and deleteItem methods
    // Fetches the outline from the given URL
    static async fetchOutline(url) {
        const response = await fetch(url);
        if(!response.ok) {
            throw new Error("Failed to fetch outline");
        }
        const data = await response.json();
        // Create a new outline instance
        const outline = new Outline(data.url, data.name);
        const childrenUrls = data.children;
        // Fetch the children of the outline
        await outline.getChildren(childrenUrls); 
        return outline;
    }
    // Fetches the children of the current outline
    async getChildren(childrenUrls) {
        for (const childUrl of childrenUrls) {
            // Create a new outline for each child
            const child = await Outline.fetchOutline(childUrl);
            child.parent = this;
            // Add the child to the current outline and the UI
            this.items.push(child);
            this.childrenContainer.appendChild(child.view);
        }
    }
    // Adds a new item to the outline
    async addItem() {
        const response = await fetch(this.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if(!response.ok) {
            throw new Error("Failed to add item");
        }
        const data = await response.json();
        const newOutline = new Outline(data.url, data.name, this);
        // Add the new item to the outline and the UI
        this.items.push(newOutline);
        this.childrenContainer.appendChild(newOutline.view);
        return newOutline;
    }

    // Edits the name of the current item
    async editItem(newName) {
        const response = await fetch(this.url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: newName })
        });
        if(!response.ok) {
            throw new Error("Failed to edit name");
        }
        const data = await response.json();
        // Update the name in the outline and the UI
        this.name = data.name;
        console.log("Updated name:", this.name);
        this.nameView.textContent = this.name;
    }

    // Deletes the current item from the outline
    async deleteItem() {
        const response = await fetch(this.url, {
            method: "DELETE"
        });
        if (!response.ok) {
            throw new Error("Failed to delete item");
        }

        if (this.parent) {
            // Remove this item from the parent's items array
            const index = this.parent.items.indexOf(this);
            if (index !== -1) {
                this.parent.items.splice(index, 1);
            }

            // Remove the item from the UI
            this.view.remove();
            // Update the URLs of all children that come after the deleted item
            this.parent.updateChildUrls(index);
        }
    }

    // These update Url methods were made using chatGPT
    // Prompt: "I need to update the urls of all the children and the children's children
    // of each outline that comes after the one that is deleted, how can i do this?"
    // Accessed: October 26, 2024
    // Update the URLs of all children that come after the deleted item
    updateChildUrls(startIndex) {
        for (let i = startIndex; i < this.items.length; i++) {
            const child = this.items[i];
            const newUrl = `${this.url}/${i}`;
            child.updateUrl(newUrl);
    
            // Update all descendants recursively
            child.updateDescendantUrls();
        }
    }
    // Update the URL of the current outline
    updateUrl(newUrl) {
        this.url = newUrl;
    }
    
    // Update the URLs of all descendants of the current outline
    updateDescendantUrls() {
        this.items.forEach((child, index) => {
            const newUrl = `${this.url}/${index}`;
            child.updateUrl(newUrl);
            child.updateDescendantUrls();
        });
    }
    
}

// Load the outline when the window is loaded
window.addEventListener("load", async () => {
    try {
        // Fetch the base outline from the API
        const rootOutline = await Outline.fetchOutline("/outline/");
        const loading = document.querySelector("h1");
        // Remove the loading text
        loading.style.display = "none";
        
        // Append the outline view directly to the body
        document.body.appendChild(rootOutline.view);

    } catch (error) {
        console.error("Error loading outline:", error);
        alert("Failed to load the outline. Please try again.");
    }
});
