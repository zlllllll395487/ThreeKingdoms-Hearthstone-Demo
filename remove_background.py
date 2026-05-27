
import os
from rembg import remove
from PIL import Image

INPUT_FOLDER = r"d:\三国炉石\ai扣背景test"
OUTPUT_FOLDER = os.path.join(INPUT_FOLDER, "transparent_output")

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

for filename in os.listdir(INPUT_FOLDER):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        input_path = os.path.join(INPUT_FOLDER, filename)
        output_path = os.path.join(OUTPUT_FOLDER, filename)
        
        print(f"处理中: {filename}")
        with Image.open(input_path) as img:
            result = remove(img)
            result.save(output_path, "PNG")
            print(f"已保存: {output_path}")

print("✅ 全部处理完成！透明图保存在 transparent_output 文件夹里。")

