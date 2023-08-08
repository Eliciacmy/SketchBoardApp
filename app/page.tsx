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
    setSelectedImageId((prevSelectedImageId) =>
      prevSelectedImageId === index ? null : index
    );
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
            await fetchAndConvertImagesToBase64(generatedOutput)
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
      <div className="mx-auto px-4 h-screen flex justify-center items-center bg-violet-950 flex-col">
        <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-600">
          <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
            <a href="http://localhost:3000/" className="flex items-center">
              <img
                src="https://i.imgur.com/hKynipG.png"
                className="h-8 mr-3"
                alt="Flowbite Logo"
              />
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                SketchBoard
              </span>
            </a>
            <div className="flex md:order-2">
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-3 md:mr-0 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Get started
              </button>
              <button
                data-collapse-toggle="navbar-sticky"
                type="button"
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-controls="navbar-sticky"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 17 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 1h15M1 7h15M1 13h15"
                  />
                </svg>
              </button>
            </div>
            <div
              className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
              id="navbar-sticky"
            >
              <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                  <a
                    href="#"
                    className="block py-2 pl-3 pr-4 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500"
                    aria-current="page"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                  >
                    Collection
                  </a>
                </li>
                {/* <li>
                  <a href="#" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Services</a>
                </li>
                <li>
                  <a href="#" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Contact</a>
                </li> */}
              </ul>
            </div>
          </div>
        </nav>

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

      <div className="w-full bg-red-100 -mt-80">
        <div className="h-[500px] m-auto overflow-hidden relative w-auto">
          <ul className="flex w-[calc(500px*28)] animate-scroll">
            <li className="w-[896px]">
              <img src="https://i.imgur.com/btegyvp.png" alt="Image 1" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/4gdcoQq.png" alt="Image 2" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/3uxoSdF.png" alt="Image 3" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/8SNqWwt.png" alt="Image 4" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/4gdcoQq.png" alt="Image 5" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/3uxoSdF.png" alt="Image 6" />
            </li>
            <li className="w-[896px]">Image 7</li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/btegyvp.png" alt="Image 1" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/4gdcoQq.png" alt="Image 2" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/3uxoSdF.png" alt="Image 3" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/8SNqWwt.png" alt="Image 4" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/4gdcoQq.png" alt="Image 5" />
            </li>
            <li className="w-[896px]">
              <img src="https://i.imgur.com/3uxoSdF.png" alt="Image 6" />
            </li>
            <li className="w-[896px]">Image 7</li>
          </ul>
        </div>
      </div>

      <div className="h-fit flex items-center flex-col px-20 mt-40">
        <h1 className="mb-10 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          Craft your Image
        </h1>
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
            {selectedImage ? (
              <p></p>
            ) : (
              <div
                className="flex items-center text-red-300 text-sm font-bold px-4 py-3 w-full"
                role="alert"
              >
                <svg
                  className="fill-current w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
                </svg>
                <p>No image selected.</p>
              </div>
            )}
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
              Describe your creation in detail
            </label>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={isLoading}
                id="message"
                rows={6}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Describe what you want to see (e.g., a girl with pale face, portrait, amazingly detailed face, artstation, spectacular detail, volumetric lighting, dramatic lighting, artstation trend, 8k uhd)..."
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
                  className="px-60 py-5 text-lg text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 flex items-center mt-11 mb-11"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                  <span>Generate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="">
        <h2 className="text-4xl font-extrabold dark:text-white mt-40 mb-5 ml-20">
          Latest Crafts
        </h2>
        <hr />
      </div>

      <div className="flex flex-row w-full py-24">
        {generatedOutput ? (
          generatedOutput.map((imageUrl, index) => (
            <div
              key={index}
              className={`relative w-1/3 box-border transition-opacity duration-300 cursor-pointer ${
                selectedImageId === null
                  ? ""
                  : selectedImageId === index
                  ? ""
                  : "opacity-50"
              }`}
              onClick={() => handleImageClick(index)}
            >
              <div
                className={`absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center ${
                  selectedImageId === index ? "block" : "hidden"
                }`}
              >
                ✓
              </div>
              <img
                src={imageUrl}
                alt={`Generated Image ${index}`}
                className="w-full"
              />
              {selectedImageId !== null && selectedImageId !== index && (
                <div className="absolute inset-0 bg-black opacity-60"></div>
              )}
            </div>
          ))
        ) : (
          <p>No recent generated output</p>
        )}
      </div>

      {selectedImageId !== null ? (
        <div>
          <label
            htmlFor="message"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your message
          </label>
          <textarea
            disabled={isLoading}
            id="story"
            rows={6}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            // value={message}
            // onChange={handleTextareaChange}
          ></textarea>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
