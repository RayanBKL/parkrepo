from PIL import Image

img = Image.open("logo parkflow.jpg").convert("RGBA")
width, height = img.size
pixels = img.load()

# L'icône au centre contient des couleurs vives : Bleu/Cyan (B > R + 20) ou Vert (G > R + 20)
min_x, max_x = width, 0
min_y, max_y = height, 0

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Détecter les pixels colorés du logo (pas le fond gris/blanc)
        is_blue = (b > r + 25) and (b > 100)
        is_green = (g > r + 25) and (g > 100)
        
        # Et Y < height * 0.6 pour ne pas prendre le texte
        if (is_blue or is_green) and y < height * 0.6:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Exact Icon Bounding Box: ({min_x}, {min_y}) to ({max_x}, {max_y})")

padding = 10
min_x = max(0, min_x - padding)
min_y = max(0, min_y - padding)
max_x = min(width, max_x + padding)
max_y = min(height, max_y + padding)

icon = img.crop((min_x, min_y, max_x, max_y))
iw, ih = icon.size

new_img = Image.new("RGBA", (iw, ih), (0, 0, 0, 0))
new_pixels = new_img.load()
icon_pixels = icon.load()

for y in range(ih):
    for x in range(iw):
        r, g, b, a = icon_pixels[x, y]
        brightness = (r + g + b) / 3.0
        
        # Seuil de transparence fond blanc/gris clair
        if r > 238 and g > 238 and b > 238:
            new_pixels[x, y] = (r, g, b, 0)
        elif r > 200 and g > 200 and b > 200:
            alpha = int((255 - brightness) / (255 - 200) * 255)
            new_pixels[x, y] = (r, g, b, max(0, min(255, alpha)))
        else:
            new_pixels[x, y] = (r, g, b, 255)

new_img.save("public/logo-icon.png", "PNG")

# Favicon carré
max_dim = max(iw, ih)
square_icon = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
offset_x = (max_dim - iw) // 2
offset_y = (max_dim - ih) // 2
square_icon.paste(new_img, (offset_x, offset_y), new_img)

square_icon.resize((64, 64), Image.LANCZOS).save("public/favicon.png", "PNG")
square_icon.resize((32, 32), Image.LANCZOS).save("public/favicon-32.png", "PNG")
square_icon.resize((192, 192), Image.LANCZOS).save("public/favicon-192.png", "PNG")
print("Saved perfect transparent logo-icon.png and favicons!")
