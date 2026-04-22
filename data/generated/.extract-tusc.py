import opendataloader_pdf
opendataloader_pdf.convert(
    ["data/generated/raw/AL-district-tuscaloosa-city-ai-position.pdf"],
    output_dir="data/generated/pdf-structured",
    format="json"
)
