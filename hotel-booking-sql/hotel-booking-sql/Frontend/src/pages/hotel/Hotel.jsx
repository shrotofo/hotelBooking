import "./hotel.css";
import Navbar from "../../components/navbar2/Navbar2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faChevronLeft, faChevronRight, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { SearchContext } from '../../context/SearchContext';
import { format } from 'date-fns';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';


// Custom icon for the map marker
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  shadowSize: [41, 41]
});



const Hotel = () => {
  const { searchParams, setSearchParams } = useContext(SearchContext);
  const navigate = useNavigate();
  const location = useLocation();
  const hotel = location.state.hotel; // Extracting hotel data from state
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const [RoomDetails, SetRoomDetails] = useState();
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomSlideNumbers, setRoomSlideNumbers] = useState({});


  const handleNavigate = (price, description) => {
    navigate(`/hotels/${hotel.id}/book`, { state: { price, description, hotel } });
  };

  function getRatingText(rating) {
    if (rating >= 4) {
      return "Excellent";
    } else if (rating >= 3.5) {
      return "Very Good";
    } else if (rating >= 3) {
      return "Good";
    } else if (rating >= 2.5) {
      return "Average";
    } else if (rating >= 1.5) {
      return "Below Average";
    } else {
      return "Poor";
    }
  }

  useEffect(() => {
    const fetchroomprice = async () => {




      if (searchParams.roomDetails && searchParams.roomDetails[hotel.id]) {
        // If room details exist, use them and avoid fetching again
        console.log("Attempting to set RoomDetails:", searchParams.roomDetails[hotel.id]);
        SetRoomDetails(searchParams.roomDetails[hotel.id]);
        if (searchParams.roomDetails[hotel.id]){
        setLoadingRoom(false);
        return;
        }
      }

      try {
        const response = await axios.get(`http://localhost:5000/hotels/${hotel.id}/prices`, {
          params: {
            destination_id: searchParams.destination_id,
            checkin: searchParams.checkin,
            checkout: searchParams.checkout,
            guests: searchParams.adults,
          },
        });
        if (response.data.completed) {
          console.log(response.data, "room response");
          const rooms = response.data.rooms;

          setSearchParams((prev) => ({
            ...prev,
            roomDetails: {
              ...prev.roomDetails,
              [hotel.id]: rooms // Use hotel.id as the key to store the rooms
            }
          }));

          SetRoomDetails(rooms);
          if (RoomDetails){
          setLoadingRoom(false);
          }
          // Handle the response, e.g., update state with the fetched data
        } else {
          console.log('Response not completed, polling again...');
          setTimeout(fetchroomprice, 5000); // Poll every 5 seconds
        }



        console.log(response.data, "room response");
      }
      catch (error) {
        console.error('Error fetching hotel room price:', error);
      }

    }
    fetchroomprice()
    //SetRoomDetails(searchParams.rooms);
    //setLoadingRoom(false);



  }, [hotel, searchParams, setSearchParams]);

  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };


  const photos = hotel.image_details.prefix
    ? Array.from({ length: hotel.imageCount }, (_, i) => ({
      src: `${hotel.image_details.prefix}${i}${hotel.image_details.suffix}`
    }))
    : [];

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? photos.length - 1 : slideNumber - 1;
    } else {
      newSlideNumber = slideNumber === photos.length - 1 ? 0 : slideNumber + 1;
    }

    setSlideNumber(newSlideNumber);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleMove("r");
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [slideNumber]);

  const handleThumbnailClick = (index) => {
    setSlideNumber(index);
  };

  const handleRoomMove = (index, direction) => {
    setRoomSlideNumbers(prevState => {
      const currentSlideNumber = prevState[index] || 0;
      let newSlideNumber;

      if (direction === "l") {
        newSlideNumber = currentSlideNumber === 0 ? RoomDetails[index].images.length - 1 : currentSlideNumber - 1;
      } else {
        newSlideNumber = currentSlideNumber === RoomDetails[index].images.length - 1 ? 0 : currentSlideNumber + 1;
      }

      return { ...prevState, [index]: newSlideNumber };
    });
  };

  const handleRoomThumbnailClick = (index, imgIndex) => {
    setRoomSlideNumbers(prevState => ({ ...prevState, [index]: imgIndex }));
  };

  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const amenitiesToShow = showAllAmenities ? Object.keys(hotel.amenities) : Object.keys(hotel.amenities).slice(0, 5);

  const handleShowMore = () => {
    setShowAllAmenities(true);
  };

  const handleShowLess = () => {
    setShowAllAmenities(false);
  };

  return (
    <div>
      <Navbar />
      <div className="hotelContainer">
        {open && (
          <div className="slider">
            <FontAwesomeIcon icon={faTimes} className="close" onClick={() => setOpen(false)} />
            <FontAwesomeIcon icon={faChevronLeft} className="arrow" onClick={() => handleMove("l")} />
            <div className="sliderWrapper">
              <img src={photos[slideNumber].src} alt="" className="sliderImg" />
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="arrow" onClick={() => handleMove("r")} />
          </div>
        )}
        <div className="hotelContent">
          <div className="hotelDetailsWrapper">
          <h1 className="siTitle">{hotel.name}</h1>

            <div className="hotelAddress">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>{hotel.address}</span>
            </div>
            <span className="hotelRating">
              Rating: {hotel.rating} ({getRatingText(hotel.rating)})
            </span>
            <span className="hotelDistance">Distance: {hotel.distance.toFixed(2)}m</span>
            <span className="hotelPriceHighlight">Book a stay over ${hotel.price} only!</span>
            <div className="hotelImages">
              <div className="carousel">
                <FontAwesomeIcon icon={faChevronLeft} className="carouselArrow left" onClick={() => handleMove("l")} />
                <div className="carouselWrapper">
                  <img src={photos[slideNumber].src} alt="" className="carouselImg" />
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="carouselArrow right" onClick={() => handleMove("r")} />
              </div>
              <div className="thumbnailCarousel">
                <div className="thumbnailWrapper">
                  {photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo.src}
                      alt=""
                      className={`thumbnailImg ${i === slideNumber ? "active" : ""}`}
                      onClick={() => handleThumbnailClick(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="hotelDetails">
              <div className="hotelDetailsTexts">
                <h1 className="hotelTitle">Stay in the heart of {hotel.original_metadata.city}</h1>
                <p className="hotelDesc" dangerouslySetInnerHTML={{ __html: hotel.description }}></p>
                <div className="hotelTrustYouScores">
                  <h2>TrustYou Scores</h2>
                  {/* parsefloat to remove decimals, only Kaligo Overall is out of 10, the rest is 100 */}
                  <div className="scoreContainer">
                    <span className="label">Kaligo Overall</span>
                    <progress value={hotel.trustyou.score.kaligo_overall} max="10"></progress>
                    <span>{parseFloat(hotel.trustyou.score.kaligo_overall)}</span>
                  </div>
                  <div className="scoreContainer">
                    <span className="label">Overall</span>
                    <progress value={hotel.trustyou.score.overall} max="100"></progress>
                    <span>{parseFloat(hotel.trustyou.score.overall)}</span>
                  </div>
                  <div className="scoreContainer">
                    <span className="label">Solo</span>
                    <progress value={hotel.trustyou.score.solo} max="100"></progress>
                    <span>{parseFloat(hotel.trustyou.score.solo)}</span>
                  </div>
                  <div className="scoreContainer">
                    <span className="label">Couple</span>
                    <progress value={hotel.trustyou.score.couple} max="100"></progress>
                    <span>{parseFloat(hotel.trustyou.score.couple)}</span>
                  </div>
                  <div className="scoreContainer">
                    <span className="label">Family</span>
                    <progress value={hotel.trustyou.score.family} max="100"></progress>
                    <span>{parseFloat(hotel.trustyou.score.family)}</span>
                  </div>
                  <div className="scoreContainer">
                    <span className="label">Business</span>
                    <progress value={hotel.trustyou.score.business} max="100"></progress>
                    <span>{parseFloat(hotel.trustyou.score.business)}</span>
                  </div>
                </div>
                <div className="hotelCategories">
                  <h2>Categories</h2>
                  {Object.keys(hotel.categories).map((key) => (
                    <div key={key}>
                      <p>{hotel.categories[key].name}: {hotel.categories[key].score}</p>
                    </div>
                  ))}
                </div>
                <div className="hotelAmenitiesRatings">
                  <h2>Amenities Ratings</h2>
                  {hotel.amenities_ratings.map((amenity, index) => (
                    <div key={index} className="scoreContainer">
                      <span className="label">{amenity.name}</span>
                      <progress value={amenity.score} max="100"></progress>
                      <span>{parseFloat(amenity.score)}</span>
                    </div>
                  ))}
                </div>
                <div className="hotelAmenities">
                  <h2>Amenities</h2>
                  <ul>
                    {amenitiesToShow.map((key) => (
                      <li key={key}>{key.replace(/([A-Z])/g, ' $1')}</li>
                    ))}
                  </ul>
                  {!showAllAmenities ? (
                    <button onClick={handleShowMore} className="showMoreButton">Show more...</button>
                  ) : (
                    <button onClick={handleShowLess} className="showMoreButton">Show less</button>
                  )}
                </div>
              </div>
              <div className="hotelMap">
                <div className="hotelDetailsPrice">
                  <h1>Perfect for a {hotel.categories.family_hotel ? "Family" : "Business"} stay!</h1>

                </div>
                <MapContainer center={[hotel.latitude, hotel.longitude]} zoom={13} style={{ height: "400px", width: "100%", borderRadius: "8px" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[hotel.latitude, hotel.longitude]} icon={redIcon}>
                    <Popup>
                      {hotel.name} <br /> {hotel.address}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>

          {/* The room options */}
          <div className="roomDetails">
            <h2>Available Rooms</h2>
            {loadingRoom ? (
              <div className="loadingContainer">
                <CircularProgress size={24} color="inherit" />
                <p>Loading room details...</p>
              </div>
            ) : (
              <ul>
                {RoomDetails && RoomDetails.map((room, index) => (
                  <li key={index} className="roomDetailItem">
                    <div className="roomImageContainer">
                      <img src={room.images[roomSlideNumbers[index] || 0].url} alt="" className="roomcarouselImg" />
                    </div>
                    <div className="roomDetailsContent">
                      <h3>{room.description}</h3>
                      <p><b>Price: ${room.price}</b></p>
                      <p class="roomAmenities">Amenities:</p>
                      <ul className="amenitiesList">
                        {room.amenities.slice(0, 3).map((amenity, amenityIndex) => (
                          <li key={amenityIndex}>{amenity}</li>
                        ))}
                        {room.amenities.length > 3 && <li>+{room.amenities.length - 3} more</li>}
                      </ul>
                      <div className="buttonContainer">
                        <button className="roomButton" onClick={() => handleNavigate(room.price, room.description, hotel)}>Reserve or Book Now!</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
};

export const getRatingText = (rating) => {
  if (rating >= 4) {
    return "Excellent";
  } else if (rating >= 3.5) {
    return "Very Good";
  } else if (rating >= 3) {
    return "Good";
  } else if (rating >= 2.5) {
    return "Average";
  } else if (rating >= 1.5) {
    return "Below Average";
  } else {
    return "Poor";
  }
};

export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

export default Hotel;