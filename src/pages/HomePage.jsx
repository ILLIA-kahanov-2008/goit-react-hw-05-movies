import React from 'react';
// import PropTypes from 'prop-types';
import { getTrending } from '../services/movies-api';

import { useState, useEffect } from 'react';
import GalleryItem from '../components/GalleryItem/GalleryItem';
import PageTitle from '../components/PageTitle/PageTitle';
import LoaderComponent from '../components/Loader/LoaderComponent';
import PaginationList from '../components/Pagination/PaginationList';
import NotFoundPage from './NotFoundPage';
import default_backdrop from '../images/default_backdrop.jpg';

const Status = {
  IDLE: 'idle',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

function HomePage({ history }) {
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(3);
  const [totalPages, setTotalPages] = useState(0);
  const { push, location } = history;
  const [status, setStatus] = useState(Status.PENDING);
  const [errorMessage, setErrorMessage] = useState(null);
  const [pageScrollHeight, setPageScrollHeight] = useState(0);
  const [loaderTitle, setLoaderTitle] = useState('');

  useEffect(() => {
    location.search !== '' &&
      setCurrentPage(Number(new URLSearchParams(location.search).get('page')));
    if (location.state) {
      setLoaderTitle(`Loading ${currentPage} page`);
      setMovies(location.state.movies);
      setPageScrollHeight(location.state.pageScrollHeight);
      setTotalPages(location.state.totalPages);
      setStatus(Status.RESOLVED);
    } else {
      setPageScrollHeight(0);
      setLoaderTitle('Loading trending movies');
      getTrending(currentPage).then(response => {
        setMovies([...response.results]);
        setTotalPages(response.total_results);
        setStatus(Status.RESOLVED);
        location.search = `page=${currentPage}`;
        push('/?' + location.search);
      });
    }
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: pageScrollHeight,
      behavior: 'smooth',
    });
  }, [pageScrollHeight]);

  const handlePageChange = pageNumber => {
    setStatus(Status.PENDING);
    setLoaderTitle(`Loading ${pageNumber} page`);
    getTrending(pageNumber)
      .then(response => {
        if (response.total_results === 0) {
          throw new Error(`we couldn't find any results`);
        }
        setMovies([...response.results]);
        setStatus(Status.RESOLVED);
        location.search = `page=${pageNumber}`;
        push('/?' + location.search);
      })
      .catch(error => {
        setStatus(Status.REJECTED);
        setErrorMessage(error.message);
      });
    setCurrentPage(pageNumber);
  };

  const getLocation = pathname => ({
    state: {
      from: location,
    },
    pathname,
  });

  const openMovieDetailsPage = movieID => {
    push(getLocation('/movies/' + movieID));
    location.state = {
      movies,
      pageScrollHeight: document.documentElement.scrollTop,
      totalPages,
    };
  };

  if (status === Status.RESOLVED || status === Status.PENDING) {
    return (
      <>
        <PageTitle text="Trending today">
          <PaginationList
            currentPage={currentPage}
            itemsPerPage={20}
            totalPages={totalPages}
            displayedItems={5}
            handlePageChange={handlePageChange}
          />
        </PageTitle>

        <ul className="moviesList" id="moviesList">
          {movies &&
            movies.map(
              ({
                id,
                backdrop_path,
                original_title,
                vote_average,
                release_date,
              }) => {
                let backdrop = backdrop_path
                  ? `https://image.tmdb.org/t/p/w780/${backdrop_path}`
                  : default_backdrop;
                return (
                  <GalleryItem
                    key={id}
                    backdrop={backdrop}
                    title={original_title}
                    rating={vote_average}
                    releaseDate={release_date}
                    movieID={id}
                    cbOnClick={openMovieDetailsPage}
                  />
                );
              },
            )}
        </ul>
        {status === Status.PENDING && <LoaderComponent title={loaderTitle} />}
      </>
    );
  }

  status === Status.REJECTED && <NotFoundPage message={errorMessage} />;
}

export default HomePage;
