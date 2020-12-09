import React, { Component, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { CSVLink } from "react-csv";
import {
  handleGetDownloadDataAction,
  handleGetPraxisYearsAction,
  updateDetailedSearch,
} from "../../actions/search";
import {
  capitalizeFirstLetter,
  addUnderscoreToString,
  createQueryStringFromParams,
  currencyFormatter,
  availablePraxisYears,
} from "../../utils/helper";
import MapViewer from "./MapViewer";
import * as downloadIcon from "../../assets/img/download-icon.png";
import * as infoIcon from "../../assets/img/info-icon.png";
import { APISearchQueryFromRoute } from "../../utils/api";

/*Detailed result components need to know what the ppraxis 
  data properties, ids, and data return type (details type) are. 
  They also use internal state in some cases. */

function ContentSwitch(props) {
  const { results, resultsType } = useSelector(
    (state) => state.searchState.detailedSearch
  );

  if (results && results.length > 0 && resultsType) {
    switch (props.detailsType) {
      case "parcels-by-geocode:single-parcel":
        return <SingleParcel result={results[0]} />;

      case "parcels-by-geocode:multiple-parcels":
        return <MultipleParcels results={results} />;

      case "parcels-by-speculator":
        return <SpeculatorParcels results={results} />;

      case "parcels-by-code":
        return <CodeParcels results={results} />;

      default:
        return null;
    }
  } else if (results && results.length === 0) {
    //TODO: BUILD OUT THESE UIS
    return <NoResults />;
  } else {
    return <div>ERROR</div>;
  }
}

function NoResults(props) {
  const { searchState } = useSelector((state) => state);
  const { drawerIsOpen, results } = searchState.detailedSearch;
  const {
    searchTerm,
    searchYear,
    searchCoordinates,
  } = searchState.searchParams;
  return (
    <div className="results-inner">
      {" "}
      <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/map_marker_rose.svg"
            alt="A map marker icon"
          />
          <span>No Results for this Search</span>
        </div>
        <div className="detailed-properties">
          <p>Lorem ipsum.</p>
        </div>
      </div>
    </div>
  );
}

function CodeParcels(props) {
  const { searchState } = useSelector((state) => state);
  const { drawerIsOpen, results } = searchState.detailedSearch;
  const {
    searchTerm,
    searchYear,
    searchCoordinates,
  } = searchState.searchParams;

  const [speculatorData, setSpeculatorsData] = useState(null);
  const [topCount, setTopCount] = useState(null);
  const [topPer, setTopPer] = useState(null);

  const reducer = (accumulator, currentValue) =>
    Number(accumulator) + Number(currentValue);

  const calulateTotals = (data) => {
    const sumCount = data.map((record) => record.count).reduce(reducer);
    const sumPer = data.map((record) => record.per).reduce(reducer);
    return { sumCount, sumPer };
  };

  useEffect(() => {
    (async () => {
      const code = results[0].properties.propzip; // need some error handling to ensure there is a propzip
      if (code) {
        const route = `/api/detailed-search?type=speculation-by-code&code=${searchTerm}&year=${searchYear}`;
        const data = await APISearchQueryFromRoute(route);
        setSpeculatorsData(data);

        // sub calculations to populate charts
        const { sumCount, sumPer } = calulateTotals(data.slice(0, 10));
        setTopCount(sumCount);
        setTopPer(sumPer);
      }
    })();
    return () => null;
  }, [searchTerm]);

  if (speculatorData) {
    return (
      <div className="results-inner scroller">
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img
              src="https://property-praxis-web.s3-us-west-2.amazonaws.com/map_marker_polygon_rose.svg"
              alt="A map marker icon"
            />
            <span>Details for {searchTerm}</span>
          </div>
          <div className="detailed-properties">
            <p>
              There were a total of
              <span>{` ${speculatorData[0].total} properties `}</span> owned by
              <span>{` ${speculatorData.length} speculators `}</span>
              in <span>{searchTerm} </span> for the year
              <span>{` ${searchYear}`}</span>. The top 10 speculators own
              <span>{` ${Math.round(topPer)}% `}</span>
              of the specualtive properties we have on record for this zip code.
            </p>
          </div>
          <div className="detailed-title">
            <img
              src="https://property-praxis-web.s3-us-west-2.amazonaws.com/question_mark_rose.svg"
              alt="A question mark icon"
            />
            <span>Top 10 Speculators</span>
          </div>
          <div className="detailed-speculator">
            {speculatorData.slice(0, 10).map((record) => {
              return (
                <div className="speculator-item" key={record.own_id}>
                  <div>
                    <Link
                      to={createQueryStringFromParams(
                        {
                          type: "zipcode",
                          code: searchTerm,
                          ownid: record.own_id,
                          coordinates: null,
                          year: searchYear,
                        },
                        "/map"
                      )}
                    >
                      <span>{capitalizeFirstLetter(record.own_id)}</span>
                    </Link>
                  </div>
                  <div>
                    <div>{`${record.count}  properties`}</div>
                    <div>{`${Math.round(record.per)}% ownership`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function SpeculatorParcels(props) {
  const { searchState } = useSelector((state) => state);
  const { drawerIsOpen, results } = searchState.detailedSearch;
  const {
    searchTerm,
    searchYear,
    searchCoordinates,
  } = searchState.searchParams;

  const [zipcodes, setZipcodes] = useState(null);

  useEffect(() => {
    (async () => {
      const code = results[0].properties.propzip; // need some error handling
      if (code) {
        const route = `/api/detailed-search?type=codes-by-speculator&ownid=${searchTerm}&year=${searchYear}`;
        const data = await APISearchQueryFromRoute(route);
        setZipcodes(data);
      }
    })();
    return () => null;
  }, [searchTerm, searchYear]);

  return (
    <div className="results-inner">
      {" "}
      <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/map_marker_rose.svg"
            alt="A map marker icon"
          />
          <span>{searchTerm}</span>
        </div>
        <div className="detailed-properties">
          <p>Lorem ipsum.</p>
        </div>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/question_mark_rose.svg"
            alt="A question mark icon"
          />
          <span>Properties by Zip Code for this Speculator</span>
        </div>
        <div className="detailed-properties">{JSON.stringify(zipcodes)}</div>
      </div>
    </div>
  );
}

function MultipleParcels(props) {
  const { searchState } = useSelector((state) => state);
  const { drawerIsOpen, recordYears, results } = searchState.detailedSearch;
  const {
    searchTerm,
    searchYear,
    searchCoordinates,
  } = searchState.searchParams;
  const dispatch = useDispatch();

  const [speculators, setSpeculators] = useState(null);

  useEffect(() => {
    (async () => {
      const code = results[0].properties.propzip; // need some error handling
      if (code) {
        const route = `/api/detailed-search?type=speculators-by-code&code=${results[0].properties.propzip}&year=${searchYear}`;
        const data = await APISearchQueryFromRoute(route);
        setSpeculators(data);
      }
    })();
    return () => null;
  }, [dispatch, searchTerm]);

  return (
    <div className="results-inner scroller">
      <MapViewer searchState={searchState} dispatch={dispatch} />
      <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/map_marker_rose.svg"
            alt="A map marker icon"
          />
          <span>{searchTerm}</span>
        </div>
        <div className="detailed-properties">
          <p>
            We could not find a speculation record for <span>{searchTerm}</span>{" "}
            in <span>{searchYear}</span>, but in {results[0].properties.propzip}{" "}
            we have identified {results.length} speculative properties.
          </p>
        </div>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/question_mark_rose.svg"
            alt="A question mark icon"
          />
          <span> Top Speculators in this Zip Code</span>
        </div>
        <div className="detailed-properties">{JSON.stringify(speculators)}</div>
      </div>
    </div>
  );
}

function SingleParcel(props) {
  const { searchState } = useSelector((state) => state);
  const { drawerIsOpen, recordYears, viewer } = searchState.detailedSearch;
  const {
    searchTerm,
    searchYear,
    searchCoordinates,
  } = searchState.searchParams;
  const dispatch = useDispatch();

  const {
    own_id,
    resyrbuilt,
    saledate,
    saleprice,
    totsqft,
    propzip,
    propaddr,
    count,
    parcelno,
    parprop_id, // this is the PK for geoms in DB
  } = props.result.properties;

  // other years to search for this address
  const praxisRecordYears = availablePraxisYears(recordYears, searchYear);

  useEffect(() => {
    if (parprop_id) {
      const route = `/api/detailed-search?type=detailed-record-years&parpropid=${parprop_id}&year=${searchYear}`;
      dispatch(handleGetPraxisYearsAction(route));
    }
    return () => null;
  }, [dispatch, searchCoordinates]);

  return (
    <div className="results-inner scroller">
      <MapViewer searchState={searchState} dispatch={dispatch} />
      <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/map_marker_rose.svg"
            alt="A map marker icon"
          />
          <span>{searchTerm}</span>
        </div>
        <div className="detailed-properties">
          <div>
            <span>Speculator</span>
            <span>{capitalizeFirstLetter(own_id)}</span>
          </div>
          {propzip === 0 || propzip === null ? null : (
            <div>
              <span>Zip Code</span>
              <span>{propzip}</span>
            </div>
          )}
          {resyrbuilt === 0 || resyrbuilt === null ? null : (
            <div>
              <span>Year Built</span> <span>{resyrbuilt}</span>
            </div>
          )}

          {saledate === 0 || saledate === null ? null : (
            <div>
              <span>Last Sale Date </span>
              <span>{saledate}</span>
            </div>
          )}

          {saleprice === null ? null : (
            <div>
              <span>Last Sale Price</span>
              <span>{currencyFormatter.format(saleprice)}</span>
            </div>
          )}
          {totsqft === null ? null : (
            <div>
              <span>Area</span>
              <span>{`${totsqft.toLocaleString()} sq. ft.`}</span>{" "}
            </div>
          )}
          {parcelno === null ? null : (
            <div>
              <span>Parcel Number</span>
              <span>{parcelno}</span>{" "}
            </div>
          )}
        </div>
        <div className="detailed-title">
          <img
            src="https://property-praxis-web.s3-us-west-2.amazonaws.com/question_mark_rose.svg"
            alt="A question mark icon"
          />
          <span> About the Property</span>
        </div>
        <div className="detailed-properties">
          <p>
            In <span>{searchYear}</span>,{" "}
            <span>{capitalizeFirstLetter(propaddr)}</span> was located in
            Detroit zip code <span>{propzip}</span>, and was one of{" "}
            <span>{count}</span> properties owned by speculator{" "}
            <span>{capitalizeFirstLetter(own_id)}</span>. Additional years of
            speculation for this property ocurred in{" "}
            <span>
              {praxisRecordYears ? praxisRecordYears.join(", ") : null}
            </span>
            .
          </p>
          <Link
            to={createQueryStringFromParams(
              {
                type: "zipcode",
                code: propzip,
                coordinates: null,
                year: searchYear,
              },
              "/map"
            )}
          >
            <span>
              <img src={infoIcon} alt="More Information"></img>
              {`Search additional properties in ${propzip}.`}
            </span>
          </Link>
          <Link
            to={createQueryStringFromParams(
              {
                type: "speculator",
                ownid: own_id,
                coordinates: null,
                year: searchYear,
              },
              "/map"
            )}
          >
            <span>
              <img src={infoIcon} alt="More Information"></img>
              {`Search additional properties owned by ${capitalizeFirstLetter(
                own_id
              )}.`}
            </span>
          </Link>
          {praxisRecordYears
            ? praxisRecordYears.map((year) => {
                return (
                  <Link
                    to={createQueryStringFromParams(
                      {
                        type: "address",
                        place: searchTerm,
                        coordinates: searchCoordinates,
                        year,
                      },
                      "/map"
                    )}
                  >
                    <span>
                      <img src={infoIcon} alt="More Information"></img>
                      {`Search the ${year} record for this property.`}
                    </span>
                  </Link>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}

function DetailedSearchResults(props) {
  const { drawerIsOpen, contentIsVisible, results, resultsType } = useSelector(
    (state) => state.searchState.detailedSearch
  );
  const dispatch = useDispatch();
  const toggleDetailedResultsDrawer = () => {
    dispatch(updateDetailedSearch({ drawerIsOpen: !drawerIsOpen }));
  };

  useEffect(() => {
    if (results && resultsType) {
      dispatch(updateDetailedSearch({ drawerIsOpen: true }));
    }
    return () => null;
  }, [results, resultsType, dispatch]);

  return (
    <section className="result-drawer-static">
      <div
        className={
          drawerIsOpen
            ? "results-hamburger-button drawer-open"
            : "results-hamburger-button drawer-closed"
        }
        onClick={() => toggleDetailedResultsDrawer()}
      >
        &#9776;
      </div>
      {contentIsVisible && <ContentSwitch {...props} />}
    </section>
  );
}

export default DetailedSearchResults;

// class SingleParcel extends Component {
//   componentDidMount() {
//     // when mounted query all the years available for these coords
//     const { searchCoordinates } = this.props.searchState.searchParams;
//     if (searchCoordinates) {
//       const route = `/api/praxisyears?${encodeURI(searchCoordinates)}`;
//       this.props.dispatch(handleGetPraxisYearsAction(route));
//     }
//   }

//   render() {
//     const {
//       searchTerm,
//       searchYear,
//       searchCoordinates,
//     } = this.props.searchState.searchParams;

//     const { drawerIsOpen, recordYears } = this.props.searchState.detailedSearch;

//     const {
//       own_id,
//       resyrbuilt,
//       saledate,
//       saleprice,
//       totsqft,
//       propzip,
//       propaddr,
//       count,
//       parcelno,
//     } = this.props.result.properties;

//     // other years to search for this address
//     const praxisRecordYears = availablePraxisYears(recordYears, searchYear);

//     return (
//       <div className="results-inner scroller">
//         <MapViewer {...this.props} />
//         <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
//           <div className="detailed-title">
//             <img
//               src="https://property-praxis-web.s3-us-west-2.amazonaws.com/map_marker_rose.svg"
//               alt="A map marker icon"
//             />
//             <span>{searchTerm}</span>
//           </div>
//           <div className="detailed-properties">
//             <div>
//               <span>Speculator</span>
//               <span>{capitalizeFirstLetter(own_id)}</span>
//             </div>
//             {propzip === 0 || propzip === null ? null : (
//               <div>
//                 <span>Zip Code</span>
//                 <span>{propzip}</span>
//               </div>
//             )}
//             {resyrbuilt === 0 || resyrbuilt === null ? null : (
//               <div>
//                 <span>Year Built</span> <span>{resyrbuilt}</span>
//               </div>
//             )}

//             {saledate === 0 || saledate === null ? null : (
//               <div>
//                 <span>Last Sale Date </span>
//                 <span>{saledate}</span>
//               </div>
//             )}

//             {saleprice === null ? null : (
//               <div>
//                 <span>Last Sale Price</span>
//                 <span>{currencyFormatter.format(saleprice)}</span>
//               </div>
//             )}
//             {totsqft === null ? null : (
//               <div>
//                 <span>Area</span>
//                 <span>{`${totsqft.toLocaleString()} sq. ft.`}</span>{" "}
//               </div>
//             )}
//             {parcelno === null ? null : (
//               <div>
//                 <span>Parcel Number</span>
//                 <span>{parcelno}</span>{" "}
//               </div>
//             )}
//           </div>
//           <div className="detailed-title">
//             <img
//               src="https://property-praxis-web.s3-us-west-2.amazonaws.com/question_mark_rose.svg"
//               alt="A question mark icon"
//             />
//             <span> About the Property</span>
//           </div>
//           <div className="detailed-properties">
//             <p>
//               In <span>{searchYear}</span>,{" "}
//               <span>{capitalizeFirstLetter(propaddr)}</span> was located in
//               Detroit zipcode <span>{propzip}</span>, and was one of{" "}
//               <span>{count}</span> properties owned by speculator{" "}
//               <span>{capitalizeFirstLetter(own_id)}</span>. Additional years of
//               speculation for this property ocurred in{" "}
//               <span>
//                 {praxisRecordYears ? praxisRecordYears.join(", ") : null}
//               </span>
//               .
//             </p>
//             <Link
//               to={createQueryStringFromParams(
//                 {
//                   type: "zipcode",
//                   code: propzip,
//                   coordinates: null,
//                   year: searchYear,
//                 },
//                 "/map"
//               )}
//             >
//               <span>
//                 <img src={infoIcon} alt="More Information"></img>
//                 {`Search additional properties in ${propzip}.`}
//               </span>
//             </Link>
//             <Link
//               to={createQueryStringFromParams(
//                 {
//                   type: "speculator",
//                   ownid: own_id,
//                   coordinates: null,
//                   year: searchYear,
//                 },
//                 "/map"
//               )}
//             >
//               <span>
//                 <img src={infoIcon} alt="More Information"></img>
//                 {`Search additional properties owned by ${capitalizeFirstLetter(
//                   own_id
//                 )}.`}
//               </span>
//             </Link>
//             {praxisRecordYears
//               ? praxisRecordYears.map((year) => {
//                   return (
//                     <Link
//                       to={createQueryStringFromParams(
//                         {
//                           type: "address",
//                           place: searchTerm,
//                           coordinates: searchCoordinates,
//                           year,
//                         },
//                         "/map"
//                       )}
//                     >
//                       <span>
//                         <img src={infoIcon} alt="More Information"></img>
//                         {`Search the ${year} record for this property.`}
//                       </span>
//                     </Link>
//                   );
//                 })
//               : null}
//           </div>
//         </div>
//       </div>
//     );
//   }
// }

// function calculateResultsType(searchType, results) {
//   if (results.length === 1 && searchType === "address") {
//     return "address-single";
//   } else if (results.length > 1 && searchType === "address") {
//     return "address-multiple";
//   } else if (searchType === "speculator") {
//     return "speculator-multiple";
//   } else if (searchType === "zipcode") {
//     return "zipcode-multiple";
//   } else {
//     throw new Error(`No results type found for ${searchType}.`);
//   }
// }

// resultsType zipcode-results, speculator-results
// class ParcelResults extends Component {
//   render() {
//     // const { features } = this.props.mapData.ppraxis;
//     // const { year } = this.props.mapData;
//     const { searchTerm, searchType } = this.props.searchState;
//     const { resultsType } = this.props;

//     return (
//       <div>
//         <div className="results-title">
//           <span className="number-circle">{features.length}</span>
//           {resultsType === "zipcode-results"
//             ? " properties in "
//             : resultsType === "speculator-results"
//             ? " properties for "
//             : resultsType === "multiple-parcels"
//             ? " properties within 1km"
//             : null}
//           <div>
//             {resultsType === "zipcode-results" ||
//             resultsType === "speculator-results"
//               ? capitalizeFirstLetter(searchTerm)
//               : null}
//           </div>
//         </div>

//         <div className="partial-results-container partial-results-mobile">
//           {features.map((feature, index) => {
//             const { propno, propstr, propdir, propzip } = feature.properties;

//             //create coords from the centroid string
//             const coords = coordsFromWKT(feature.centroid);

//             //return only options that are not null
//             if (coords) {
//               const latitude = coords.latitude;
//               const longitude = coords.longitude;
//               const encodedCoords = encodeURI(JSON.stringify(coords));

//               //build the address string
//               const addressString = createAddressString(
//                 propno,
//                 propdir,
//                 propstr,
//                 propzip
//               );
//               return (
//                 <Link
//                   to={{
//                     pathname: "/map/address",
//                     search: `search=${addressString}&coordinates=${encodedCoords}&year=${year}`,
//                   }}
//                   key={index}
//                   className={index % 2 ? "list-item-odd" : "list-item-even"}
//                   onClick={() => {
//                     // this.props.dispatch(dataIsLoadingAction(true));

//                     // change the partial results
//                     // this.props
//                     //   .dispatch(handleSearchPartialAddress(addressString, year))
//                     //   .then((json) => {
//                     //     // set the search term to the first result of geocoder
//                     //     const proxySearchTerm = json[0].mb[0].place_name;
//                     //     this.props.dispatch(
//                     //       resetSearch({
//                     //         searchTerm: proxySearchTerm,
//                     //       })
//                     //     );
//                     //   });

//                     //add a point marker
//                     this.props.dispatch(
//                       setMarkerCoordsAction(latitude, longitude)
//                     );

//                     //set new viewer in results
//                     this.props.dispatch(
//                       handleGetViewerImageAction(longitude, latitude)
//                     );
//                     //set map data and then create viewport
//                     const geojsonRoute = `/api/geojson/parcels/address/${encodedCoords}/${year}`;
//                     this.props
//                       .dispatch(handleGetParcelsByQueryAction(geojsonRoute))
//                       .then((geojson) => {
//                         //trigger new viewport pass down from PartialSearchResults
//                         this.props.createNewViewport(geojson);
//                         //loading
//                         // this.props.dispatch(dataIsLoadingAction(false));
//                       });

//                     //set the display type to address
//                     this.props.dispatch(
//                       resetSearch({
//                         searchType: "address",
//                         searchDisplayType: "single-address",
//                       })
//                     );
//                     // this.props.dispatch(setSearchDisplayType("single-address"));
//                     this.props.dispatch(toggleFullResultsAction(true));
//                     // //close the partial results after
//                     this.props.dispatch(togglePartialResultsAction(false));
//                   }}
//                 >
//                   <div>
//                     <img src={mapMarkerIcon} alt="Address Result" />
//                     {addressString}
//                   </div>
//                 </Link>
//               );
//             }
//             return null;
//           })}
//         </div>
//       </div>
//     );
//   }
// }

// const ResultsSwitcher = (props) => {
//   const { searchDisplayType } = props.searchState;
//   const { dataIsLoading } = props.mapData;

//   return searchDisplayType === "full-zipcode" && !dataIsLoading ? (
//     <ParcelResults {...props} resultsType="zipcode-results" />
//   ) : searchDisplayType === "full-speculator" && !dataIsLoading ? (
//     <ParcelResults {...props} resultsType="speculator-results" />
//   ) : searchDisplayType === "multiple-parcels" && !dataIsLoading ? (
//     <ParcelResults {...props} resultsType="multiple-parcels" />
//   ) : searchDisplayType === "single-address" && !dataIsLoading ? (
//     <SingleAddressResults {...props} />
//   ) : (
//     "LOADING..."
//   );
// };

// ResultsSwitcher.propTypes = {
//   searchState: PropTypes.shape({
//     searchDisplayType: PropTypes.oneOfType([
//       PropTypes.string,
//       PropTypes.oneOf([null]),
//     ]),
//   }).isRequired,
//   mapData: PropTypes.shape({ dataIsLoading: PropTypes.bool.isRequired })
//     .isRequired,
// };

// //currently this works for zipcodes
// // resultsType zipcode-results, speculator-results
// class ParcelResults extends Component {
//   componentDidMount() {
//     const { resultsType } = this.props;
//     const { year } = this.props.mapData;
//     const { searchTerm } = this.props.searchState;
//     if (resultsType === "speculator-results") {
//       // trigger the dowload data action
//       const downloadDataRoute = `/api/speculator-search/download/${searchTerm}/${year}`;
//       this.props.dispatch(handleGetDownloadDataAction(downloadDataRoute));
//     }

//     if (resultsType === "zipcode-results") {
//       // trigger the dowload data action
//       const downloadDataRoute = `/api/zipcode-search/download/${searchTerm}/${year}`;
//       this.props.dispatch(handleGetDownloadDataAction(downloadDataRoute));
//     }
//   }

//   render() {
//     const { features } = this.props.mapData.ppraxis;
//     const { year } = this.props.mapData;
//     const { searchTerm } = this.props.searchState;
//     const { resultsType } = this.props;

//     return (
//       <div>
//         <div className="results-title">
//           <span className="number-circle">{features.length}</span>
//           {resultsType === "zipcode-results"
//             ? " properties in "
//             : resultsType === "speculator-results"
//             ? " properties for "
//             : resultsType === "multiple-parcels"
//             ? " properties within 1km"
//             : null}
//           <div>
//             {resultsType === "zipcode-results" ||
//             resultsType === "speculator-results"
//               ? capitalizeFirstLetter(searchTerm)
//               : null}
//           </div>
//         </div>

//         <div className="partial-results-container partial-results-mobile">
//           {features.map((feature, index) => {
//             const { propno, propstr, propdir, propzip } = feature.properties;

//             //create coords from the centroid string
//             const coords = coordsFromWKT(feature.centroid);

//             //return only options that are not null
//             if (coords) {
//               const latitude = coords.latitude;
//               const longitude = coords.longitude;
//               const encodedCoords = encodeURI(JSON.stringify(coords));

//               //build the address string
//               const addressString = createAddressString(
//                 propno,
//                 propdir,
//                 propstr,
//                 propzip
//               );
//               return (
//                 <Link
//                   to={{
//                     pathname: "/map/address",
//                     search: `search=${addressString}&coordinates=${encodedCoords}&year=${year}`,
//                   }}
//                   key={index}
//                   className={index % 2 ? "list-item-odd" : "list-item-even"}
//                   onClick={() => {
//                     // this.props.dispatch(dataIsLoadingAction(true));

//                     // change the partial results
//                     // this.props
//                     //   .dispatch(handleSearchPartialAddress(addressString, year))
//                     //   .then((json) => {
//                     //     // set the search term to the first result of geocoder
//                     //     const proxySearchTerm = json[0].mb[0].place_name;
//                     //     this.props.dispatch(
//                     //       resetSearch({
//                     //         searchTerm: proxySearchTerm,
//                     //       })
//                     //     );
//                     //   });

//                     //add a point marker
//                     this.props.dispatch(
//                       setMarkerCoordsAction(latitude, longitude)
//                     );

//                     //set new viewer in results
//                     this.props.dispatch(
//                       handleGetViewerImageAction(longitude, latitude)
//                     );
//                     //set map data and then create viewport
//                     const geojsonRoute = `/api/geojson/parcels/address/${encodedCoords}/${year}`;
//                     this.props
//                       .dispatch(handleGetParcelsByQueryAction(geojsonRoute))
//                       .then((geojson) => {
//                         //trigger new viewport pass down from PartialSearchResults
//                         this.props.createNewViewport(geojson);
//                         //loading
//                         // this.props.dispatch(dataIsLoadingAction(false));
//                       });

//                     //set the display type to address
//                     this.props.dispatch(
//                       resetSearch({
//                         searchType: "address",
//                         searchDisplayType: "single-address",
//                       })
//                     );
//                     // this.props.dispatch(setSearchDisplayType("single-address"));
//                     this.props.dispatch(toggleFullResultsAction(true));
//                     // //close the partial results after
//                     this.props.dispatch(togglePartialResultsAction(false));
//                   }}
//                 >
//                   <div>
//                     <img src={mapMarkerIcon} alt="Address Result" />
//                     {addressString}
//                   </div>
//                 </Link>
//               );
//             }
//             return null;
//           })}
//         </div>
//       </div>
//     );
//   }
// }

// ParcelResults.propTypes = {
//   mapData: PropTypes.shape({
//     year: PropTypes.string.isRequired,
//     ppraxis: PropTypes.object.isRequired,
//   }).isRequired,
//   searchState: PropTypes.shape({
//     searchTerm: PropTypes.string.isRequired,
//   }).isRequired,
//   resultsType: PropTypes.string.isRequired,
//   dispatch: PropTypes.func.isRequired,
// };

// class SingleAddressResults extends Component {
//   componentDidMount() {
//     // get the download data for coords
//     const { year } = this.props.mapData;
//     const { centroid } = this.props.mapData.ppraxis.features[0];
//     const coords = coordsFromWKT(centroid);
//     const encodedCoords = encodeURI(JSON.stringify(coords));
//     const downloadRoute = `/api/address-search/download/${encodedCoords}/${year}`;
//     this.props.dispatch(handleGetDownloadDataAction(downloadRoute));
//   }

//   _onZipcodeClick = () => {
//     const { features } = this.props.mapData.ppraxis;
//     const { year } = this.props.mapData;
//     const { propzip } = features[0].properties;

//     //set any marker to null
//     this.props.dispatch(setMarkerCoordsAction(null, null));

//     // change the partial results
//     // this.props.dispatch(handleSearchPartialZipcode(propzip, year));

//     //trigger data loading
//     // this.props.dispatch(dataIsLoadingAction(true));
//     // the route to parcels in zip
//     const geoJsonRoute = `/api/geojson/parcels/zipcode/${propzip}/${year}`;
//     //set map data and then create viewport
//     this.props
//       .dispatch(handleGetParcelsByQueryAction(geoJsonRoute))
//       .then((geojson) => {
//         //trigger new viewport pass down from PartialSearchResults
//         this.props.createNewViewport(geojson);
//         //fill in the text input
//         this.props.dispatch(
//           resetSearch({
//             searchTerm: propzip,
//             searchType: "Zipcode",
//             searchDisplayType: "full-zipcode",
//           })
//         );

//         //close the partial results after
//         this.props.dispatch(togglePartialResultsAction(false));

//         //toggle the results pane
//         this.props.dispatch(toggleFullResultsAction(true));
//         //trigger data loading off
//         // this.props.dispatch(dataIsLoadingAction(false));

//         //change the url
//         const state = null;
//         const title = "";
//         const newUrl = `/map/zipcode?search=${propzip}&year=${year}`;

//         //change the url
//         window.history.pushState(state, title, newUrl);
//       });
//   };

//   _onSpeculatorClick = () => {
//     const { features } = this.props.mapData.ppraxis;
//     const { year } = this.props.mapData;
//     const { own_id } = features[0].properties;

//     //set any marker to null
//     this.props.dispatch(setMarkerCoordsAction(null, null));

//     // change the partial results
//     // this.props.dispatch(handleSearchPartialSpeculator(own_id, year));

//     //set loading
//     // this.props.dispatch(dataIsLoadingAction(true));

//     // the route to parcels in zip
//     const geojsonRoute = `/api/geojson/parcels/speculator/${own_id}/${year}`;
//     //set map data and then create viewport
//     this.props
//       .dispatch(handleGetParcelsByQueryAction(geojsonRoute))
//       .then((geojson) => {
//         //trigger new viewport
//         //Note this is creating a default because it is a point
//         this.props.createNewViewport(geojson);
//         //fill in the text input
//         this.props.dispatch(
//           resetSearch({
//             searchTerm: own_id,
//             searchType: "Speculator",
//             searchDisplayType: "full-speculator",
//           })
//         );
//         //close the partial results after
//         this.props.dispatch(togglePartialResultsAction(false));

//         //toggle the results pane
//         this.props.dispatch(toggleFullResultsAction(true));
//         //trigger data loading off
//         // this.props.dispatch(dataIsLoadingAction(false));

//         //change the url
//         const state = null;
//         const title = "";
//         const newUrl = `/map/speculator?search=${own_id}&year=${year}`;

//         //change the url
//         window.history.pushState(state, title, newUrl);
//       });
//   };

//   render() {
//     const { features } = this.props.mapData.ppraxis;
//     let { searchTerm } = this.props.searchState;
//     if (features.length > 0 && features[0].properties.distance === 0) {
//       /// all the properties of address
//       const {
//         count,
//         own_id,
//         parcelno,
//         resyrbuilt,
//         saledate,
//         saleprice,
//         taxpayer1,
//         totacres,
//         totsqft,
//       } = features[0].properties;

//       //this logic can move to utils
//       const addressList = searchTerm.split(", ");
//       let addressContext;
//       if (addressList.length > 2) {
//         addressContext = addressList
//           .slice(1, addressList.length - 1)
//           .join(", ");
//       } else {
//         addressContext = addressList[1];
//       }

//       return (
//         <div>
//           <MapViewer {...this.props} />
//           <div className="detailed-title">
//             <span>
//               <img src={mapMarkerIcon} alt="Address Result" />
//               {addressList[0]}
//             </span>
//           </div>
//           <span
//             className="address-context"
//             onClick={() => {
//               this._onZipcodeClick();
//             }}
//           >
//             {addressContext}
//             <img src={infoIcon} alt="More Information"></img>
//           </span>
//           <hr></hr>
//           <div className="detailed-properties">
//             <div
//               onClick={() => {
//                 this._onSpeculatorClick();
//               }}
//             >
//               Speculator:
//               <span>
//                 {capitalizeFirstLetter(own_id)}
//                 <img src={infoIcon} alt="More Information"></img>
//               </span>
//             </div>

//             <div>
//               Properties owned: <span>{count}</span>
//             </div>
//             <div>
//               Parcel Number: <span>{parcelno}</span>
//             </div>
//             {resyrbuilt === 0 || resyrbuilt === null ? null : (
//               <div>
//                 Year built: <span>{resyrbuilt}</span>
//               </div>
//             )}
//             <div>
//               Last sale date: <span>{saledate}</span>
//             </div>
//             <div>
//               Last sale price: <span>{saleprice}</span>
//             </div>
//             <div>
//               Associated taxpayer: <span>{taxpayer1}</span>
//             </div>
//             <div>
//               Square footage: <span>{totsqft}</span>
//             </div>
//             <div>
//               Acres: <span>{totacres}</span>
//             </div>
//           </div>
//         </div>
//       );
//     }
//     return <div>LOADING...</div>;
//   }
// }

// SingleAddressResults.propTypes = {
//   mapData: PropTypes.shape({
//     year: PropTypes.string.isRequired,
//     ppraxis: PropTypes.object.isRequired,
//   }).isRequired,
//   searchState: PropTypes.shape({
//     searchTerm: PropTypes.string.isRequired,
//   }).isRequired,
//   dispatch: PropTypes.func.isRequired,
// };

// class FullResults extends Component {
//   render() {
//     const { searchTerm, searchType } = this.props.searchState;
//     const { dataIsLoading } = this.props.mapData;
//     const { downloadData } = this.props.results;

//     const filename = addUnderscoreToString(
//       `${searchType}_${capitalizeFirstLetter(
//         searchTerm
//       )}_${createDateString()}.csv`
//     );

//     return (
//       <section className="results-outer">
//         <div className="results-inner">
//           <div
//             className="results-hamburger-button"
//             onClick={() => {
//               this.props.dispatch(toggleFullResultsAction(false));
//             }}
//           >
//             &#9776;
//           </div>
//           <ResultsSwitcher {...this.props} />

//           {downloadData && !dataIsLoading ? (
//             <CSVLink data={downloadData} filename={filename}>
//               <div className="download-button">
//                 <img src={downloadIcon} alt="Download button"></img>Download
//               </div>
//             </CSVLink>
//           ) : null}
//         </div>
//       </section>
//     );
//   }
// }

// FullResults.propTypes = {
//   searchState: PropTypes.shape({
//     searchTerm: PropTypes.oneOfType([
//       PropTypes.string,
//       PropTypes.oneOf([null]),
//     ]),
//     searchType: PropTypes.string.isRequired,
//   }).isRequired,
//   mapData: PropTypes.shape({
//     dataIsLoading: PropTypes.bool.isRequired,
//   }).isRequired,
//   results: PropTypes.shape({
//     downloadData: PropTypes.oneOfType([
//       PropTypes.array,
//       PropTypes.oneOf([null]),
//     ]),
//   }).isRequired,
//   dispatch: PropTypes.func.isRequired,
// };
