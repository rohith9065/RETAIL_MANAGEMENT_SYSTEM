document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id"); // Get the product ID from the URL

    if (productId) {
        fetchProductDetails(productId);
    } else {
        alert("No product selected!");
    }
});

// Fetch product details from the backend
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`/api/product/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const product = await response.json();
        displayProductDetails(product);
    } catch (error) {
        console.error("Error fetching product details:", error);
        alert("Failed to load product details. Please try again later.");
    }
}

// Display product details on the page
function displayProductDetails(product) {
    document.getElementById("main-image").src = `/uploads/${product.image}`;
    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-price").textContent = `$${product.price}`;
    document.getElementById("product-description").textContent = product.description || "No description available.";

    // Populate specifications
    const specificationsList = document.getElementById("product-specifications");
    specificationsList.innerHTML = ""; // Clear existing specifications
    if (product.specifications && product.specifications.length > 0) {
        product.specifications.forEach(spec => {
            const li = document.createElement("li");
            li.textContent = spec;
            specificationsList.appendChild(li);
        });
    } else {
        specificationsList.innerHTML = "<li>No specifications available.</li>";
    }
}
