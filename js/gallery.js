document.addEventListener('DOMContentLoaded', () => {
    fetch("data/gallery.json")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(images => {
        const gallery = document.getElementById("gallery");
        if (!gallery) {
            console.error("Gallery element not found!");
            return;
        }

        images.forEach(image => {
          const item = document.createElement("div");
          item.className = "gallery-item";

          const img = document.createElement("img");
          img.src = image.src;
          img.alt = image.caption || "Gallery Image";
          img.loading = "lazy"; // Add lazy loading for performance

          const caption = document.createElement("div");
          caption.className = "gallery-caption";
          caption.textContent = image.caption;

          item.appendChild(img);
          item.appendChild(caption);
          gallery.appendChild(item);
        });
      })
      .catch(error => {
        console.error("Error loading gallery:", error);
        const gallery = document.getElementById("gallery");
        if (gallery) {
            gallery.innerHTML = '<p style="text-align: center; color: #c3b9d9;">Failed to load gallery. Please try again later.</p>';
        }
      });
});
