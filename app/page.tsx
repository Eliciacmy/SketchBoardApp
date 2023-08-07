/* eslint-disable @next/next/no-img-element */
"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [noOfOutputs, setNoOfOutputs] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string[]>([]);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [inputwidth, setInputWidth] = useState(0);
  const [inputheight, setInputheight] = useState(0);

  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const imageLoader = ({ src, width, quality }: any) => {
    return `https://i.imgur.com/dNsLIxo.png`;
  };

  const handleImageClick = (index: number) => {
    setSelectedImageId(index);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        const img = document.createElement("img");
        img.src = base64Image;
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          setInputWidth(width);
          setInputheight(height);
          setSelectedImage(base64Image);
        };
      };
    }
  };

  const fetchAndConvertImagesToBase64 = async (
    imageUrls: string[]
  ): Promise<string[]> => {
    try {
      const promises: Promise<string>[] = imageUrls.map(async (url) => {
        const response = await axios.get(url, { responseType: "blob" });
        const blob = response.data;

        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
        });
      });

      return Promise.all(promises);
    } catch (error) {
      console.error("Error fetching and converting images:", error);
      throw error;
    }
  };

  const handleSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    setSize: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const selectedSize = parseInt(event.target.value);
    setSize(selectedSize);
  };

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (message && selectedImage) {
      const req = JSON.stringify({
        message,
        selectedImage,
        width,
        height,
        noOfOutputs,
      });
      try {
        const response = await axios
          .post("/api/generate", req)
          .then(async (response) => {
            const images = response.data;
            await axios
              .post("/api/mongodb/removetemp")
              .then(async (response) => {
                console.log("Response:", response);
              })
              .catch((error) => {
                console.error("Error:", error);
              });
            setGeneratedOutput(images.newOutput);
            console.log(images.newOutput);
            fetchAndConvertImagesToBase64(generatedOutput)
              .then(async (base64Images: string[]) => {
                await axios
                  .post("/api/mongodb/addtemp", base64Images)
                  .then((response) => {
                    console.log("Response:", response);
                  })
                  .catch((error) => {
                    console.error("Error:", error);
                  });
              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch((err) => {
            // Handle errors
            console.error(err);
          });
      } catch (error) {
        console.error("Error generating output:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Prompt or image is missing!",
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get("/api/mongodb/gettemp"); // Replace with your API endpoint
        console.log(response);
        const fetchedImages = response.data.images; // Assuming the API response contains an array of image URLs
        setGeneratedOutput(fetchedImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

  return (
    <>
      <div className="mx-auto px-4 h-screen flex justify-center items-center bg-gradient-to-r from-violet-800 to-fuchsia-900 flex-col">
        <Image
          loader={imageLoader}
          src="me.png"
          alt="Picture of the author"
          width={500}
          height={500}
        />
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
          Button
        </button>
      </div>

      <div className="h-fit flex items-center flex-col px-20 mt-40">
        <div
          className={`w-full bg-white border border-gray-200 rounded-lg shadow pt-12 dark:bg-gray-800 dark:border-gray-700 flex items-center flex-col h-fit px-20 relative ${
            isLoading ? "bg-gray-300 opacity-50" : ""
          }`}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-500"></div>
            </div>
          )}
          <div className="flex items-center justify-center h-20">
            {selectedImage ? <p></p> : <p>No image selected</p>}
          </div>

          {/* dropbox */}

          <div className="flex items-center justify-center w-full flex-col ">
            {selectedImage && (
              <div className="pb-20">
                <img src={selectedImage} alt="Uploaded" />
              </div>
            )}
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  SVG, PNG, JPG or GIF (MAX. 800x400px)
                </p>
              </div>
              <input
                disabled={isLoading}
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="mb-6 mt-6 w-full">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Your Prompt
            </label>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={isLoading}
                id="message"
                rows={6}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Write your thoughts here..."
                value={message}
                onChange={handleTextareaChange}
              ></textarea>
              <div className="flex justify-center mt-4"></div>
              <div className="flex justify-center flex-col">
                <label
                  htmlFor="years"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Image width
                </label>
                <select
                  id="width"
                  className="block w-full p-2 mb-6 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  value={width}
                  onChange={(event) => handleSizeChange(event, setWidth)}
                >
                  <option selected>Choose a width</option>
                  <option value="128" disabled={128 < inputwidth}>
                    128
                  </option>
                  <option value="256" disabled={256 < inputwidth}>
                    256
                  </option>
                  <option value="384" disabled={384 < inputwidth}>
                    384
                  </option>
                  <option value="448" disabled={448 < inputwidth}>
                    448
                  </option>
                  <option value="512" disabled={512 < inputwidth}>
                    512
                  </option>
                  <option value="576" disabled={576 < inputwidth}>
                    576
                  </option>
                  <option value="640" disabled={640 < inputwidth}>
                    640
                  </option>
                  <option value="704" disabled={704 < inputwidth}>
                    704
                  </option>
                  <option value="768" disabled={768 < inputwidth}>
                    768
                  </option>
                  <option
                    value="832"
                    disabled={832 < inputwidth || height > 768}
                  >
                    832
                  </option>
                  <option
                    value="896"
                    disabled={896 < inputwidth || height > 768}
                  >
                    896
                  </option>
                  <option
                    value="960"
                    disabled={960 < inputwidth || height > 768}
                  >
                    960
                  </option>
                  <option
                    value="1024"
                    disabled={1024 < inputwidth || height > 768}
                  >
                    1024
                  </option>
                </select>
              </div>

              <div className="flex justify-center flex-col">
                <label
                  htmlFor="years"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Image Height
                </label>
                <select
                  id="height"
                  className="block w-full p-2 mb-6 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  value={height}
                  onChange={(event) => handleSizeChange(event, setHeight)}
                >
                  <option selected>Choose a height</option>
                  <option value="128" disabled={128 < inputheight}>
                    128
                  </option>
                  <option value="256" disabled={256 < inputheight}>
                    256
                  </option>
                  <option value="384" disabled={384 < inputheight}>
                    384
                  </option>
                  <option value="448" disabled={448 < inputheight}>
                    448
                  </option>
                  <option value="512" disabled={512 < inputheight}>
                    512
                  </option>
                  <option value="576" disabled={576 < inputheight}>
                    576
                  </option>
                  <option value="640" disabled={640 < inputheight}>
                    640
                  </option>
                  <option value="704" disabled={704 < inputheight}>
                    704
                  </option>
                  <option value="768" disabled={768 < inputheight}>
                    768
                  </option>
                  <option
                    value="832"
                    disabled={832 < inputheight || width > 768}
                  >
                    832
                  </option>
                  <option
                    value="896"
                    disabled={896 < inputheight || width > 768}
                  >
                    896
                  </option>
                  <option
                    value="960"
                    disabled={960 < inputheight || width > 768}
                  >
                    960
                  </option>
                  <option
                    value="1024"
                    disabled={1024 < inputheight || width > 768}
                  >
                    1024
                  </option>
                </select>
              </div>

              <div className="flex justify-center flex-col">
                <label
                  htmlFor="outputs"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Number of outputs
                </label>
                <select
                  id="outputs"
                  className="block w-full p-2 mb-6 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  value={noOfOutputs}
                  onChange={(event) =>
                    setNoOfOutputs(Number(event.target.value))
                  }
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  disabled={isLoading}
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="flex flex-row w-full py-24">
        {generatedOutput.map((imageUrl, index) => (
          <div
            key={index}
            className={`relative w-1/3 box-border transition-opacity duration-300 cursor-pointer 
        ${
          selectedImageId === null
            ? ""
            : selectedImageId === index
            ? ""
            : "opacity-50"
        }`}
            onClick={() => handleImageClick(index)}
          >
            <img
              src={imageUrl}
              alt={`Generated Image ${index}`}
              className="w-full"
            />
            {selectedImageId !== null && selectedImageId !== index && (
              <div className="absolute inset-0 bg-black opacity-60"></div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
