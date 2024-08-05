import React, { useState, useMemo, useCallback, useContext } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBed, faCalendarDays, faPerson } from "@fortawesome/free-solid-svg-icons";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Autocomplete, Button, TextField, Grid, Paper, ClickAwayListener, IconButton, Box, Popper } from '@mui/material';
import { debounce } from 'lodash';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import "./header.css";
import destinationsData from './destinations.json';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SearchContext } from '../../context/SearchContext'; // Adjust path accordingly

const theme = createTheme({
  palette: {
    primary: {
      main: '#262e5d',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#262e5d',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1f264b',
            },
          },
          '&.MuiButton-outlinedPrimary': {
            borderColor: '#262e5d',
            color: '#262e5d',
            '&:hover': {
              borderColor: '#1f264b',
              color: '#1f264b',
            },
          },
          '&.MuiButton-contained': {
            backgroundColor: '#262e5d',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1f264b',
            },
          },
          '&.MuiButton-outlined': {
            borderColor: '#262e5d',
            color: '#262e5d',
            '&:hover': {
              borderColor: '#1f264b',
              color: '#1f264b',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:disabled': {
            borderColor: '#d6d6d6',
          },
        },
      },
    },
  },
});

const Header = ({ type }) => {
  const { setSearchParams } = useContext(SearchContext);
  const [destination, setDestination] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [submit, setSubmit] = useState(false);
  const navigate = useNavigate();

  const uniqueDestinationsData = useMemo(() => {
    return Array.from(new Set(destinationsData.map(a => a.uid)))
      .map(uid => {
        return destinationsData.find(a => a.uid === uid);
      });
  }, []);

  const handleSearch = async (searchParams) => {
    try {
      setSubmit(true);
      const response = await axios.get('http://localhost:5000/api/hotels', {
        params: { ...searchParams }
      });
      setSubmit(false);
      navigate("/hotels", { state: { data: response.data.slice(0, 40), searchParams } });
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setSubmit(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const selectedDestination = uniqueDestinationsData.find(s => s.term === destination);

    if (!selectedDestination || !checkIn || !checkOut) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const searchParams = {
      destination_id: selectedDestination.uid,
      checkIn,
      checkOut,
      adults,
      children,
      rooms
    };

    setSearchParams(searchParams);
    handleSearch(searchParams);
  };

  const debouncedHandleChange = useCallback(
    debounce((event, newValue) => {
      setDestination(newValue ? newValue.term : '');
    }, 300),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <div className="header">
        <div className={type === "list" ? "headerContainer listMode" : "headerContainer"}>
          {type !== "list" && (
            <>
              <div className="exploreBanner">
                <h1>Explore a new world with Ascenda</h1>
              </div>
              <div className="headerSearch">
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      options={uniqueDestinationsData}
                      getOptionLabel={(option) => option.term || option.type || 'Unknown'}
                      filterOptions={(options, state) =>
                        options.filter(option => option.term && option.term.toLowerCase().startsWith(state.inputValue.toLowerCase()))
                      }
                      freeSolo
                      onChange={debouncedHandleChange}
                      renderInput={(params) => <TextField {...params} label="Destination/Hotel Name" variant="outlined" />}
                      renderOption={(props, option) => {
                        const uniqueKey = `${option.uid}-${option.term}`;
                        return (
                          <li {...props} key={uniqueKey}>
                            {option.term}
                          </li>
                        );
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Check-in"
                        value={checkIn}
                        onChange={(newValue) => {
                          setCheckIn(newValue);
                          if (checkOut && newValue >= checkOut) {
                            setCheckOut(null);
                          }
                        }}
                        minDate={new Date()}
                        disablePast
                        renderInput={(params) => <TextField {...params} variant="outlined" fullWidth />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Check-out"
                        value={checkOut}
                        onChange={(newValue) => setCheckOut(newValue)}
                        minDate={checkIn ? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000) : new Date()}
                        disablePast
                        renderInput={(params) => <TextField {...params} variant="outlined" fullWidth />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <RoomsAndGuests
                      rooms={rooms}
                      setRooms={setRooms}
                      adults={adults}
                      setAdults={setAdults}
                      children={children}
                      setChildren={setChildren}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Button variant="contained" color="primary" fullWidth onClick={handleSubmit} disabled={submit}>
                      {submit ? "Searching..." : "Search"}
                    </Button>
                  </Grid>
                </Grid>
                {errorMessage && (
                  <div className="error-message">{errorMessage}</div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="background-slider">
          <img src="https://media.cntraveller.com/photos/620a483417b9c49e6e797962/16:9/w_2240,c_limit/Exterior%2001.jpg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/8158121/pexels-photo-8158121.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/4070509/pexels-photo-4070509.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/2474063/pexels-photo-2474063.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/944463/pexels-photo-944463.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/1998439/pexels-photo-1998439.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/895555/pexels-photo-895555.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg" alt="Resort Background" className="slider-img" />
          <img src="https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg" alt="Resort Background" className="slider-img" />
        </div>
      </div>
    </ThemeProvider>
  );
};

const RoomsAndGuests = ({ rooms, setRooms, adults, setAdults, children, setChildren }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popper' : undefined;

  const handleOption = (field, action) => {
    if (field === "rooms") {
      if (action === "i") setRooms(rooms + 1);
      else if (action === "d" && rooms > 1) setRooms(rooms - 1);
    } else if (field === "adults") {
      if (action === "i") setAdults(adults + 1);
      else if (action === "d" && adults > 1) setAdults(adults - 1);
    } else if (field === "children") {
      if (action === "i") setChildren(children + 1);
      else if (action === "d" && children > 0) setChildren(children - 1);
    }
  };

  return (
    <div>
      <TextField
        aria-describedby={id}
        value={`${rooms} room, ${adults} adults, ${children} children`}
        variant="outlined"
        fullWidth
        onClick={handleClick}
        InputProps={{
          readOnly: true,
        }}
      />
      <Popper id={id} open={open} anchorEl={anchorEl} style={{ width: "300px", zIndex: 3 }}>
        <ClickAwayListener onClickAway={handleClose}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4} className="field-label">
                Rooms
              </Grid>
              <Grid item xs={8} className="field-buttons">
                <IconButton onClick={() => handleOption("rooms", "d")} disabled={rooms <= 1} size="small">
                  <RemoveIcon />
                </IconButton>
                <Box style={{ margin: "0 50px" }}>{rooms}</Box>
                <IconButton onClick={() => handleOption("rooms", "i")} size="small">
                  <AddIcon />
                </IconButton>
              </Grid>
              <Grid item xs={4} className="field-label">
                Adults
              </Grid>
              <Grid item xs={8} className="field-buttons">
                <IconButton onClick={() => handleOption("adults", "d")} disabled={adults <= 1} size="small">
                  <RemoveIcon />
                </IconButton>
                <Box style={{ margin: "0 50px" }}>{adults}</Box>
                <IconButton onClick={() => handleOption("adults", "i")} size="small">
                  <AddIcon />
                </IconButton>
              </Grid>
              <Grid item xs={4} className="field-label">
                Children
              </Grid>
              <Grid item xs={8} className="field-buttons">
                <IconButton onClick={() => handleOption("children", "d")} disabled={children <= 0} size="small">
                  <RemoveIcon />
                </IconButton>
                <Box style={{ margin: "0 50px" }}>{children}</Box>
                <IconButton onClick={() => handleOption("children", "i")} size="small">
                  <AddIcon />
                </IconButton>
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button fullWidth variant="contained" style={{ backgroundColor: "white", color: "#262e5d", border: "2px solid #262e5d", height: "53px", fontWeight: "650" }} onClick={handleClose}>Done</Button>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </div>
  );
};

export default Header;
