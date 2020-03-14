import {
  getInitialMapData,
  getInitialZipcodeData,
  // getParcelsByZipcode,
  // getParcelsBySpeculator,
  getMapData
} from "../utils/api";

export const GET_INITIAL_MAP_DATA = "GET_INITIAL_MAP_DATA";
export const GET_INITIAL_ZIPCODE_DATA = "GET_INITIAL_ZIPCODE_DATA";
// export const GET_PARCELS_BY_ZIPCODE = "GET_PARCELS_BY_ZIPCODE";
// export const GET_PARCELS_BY_SPECULATOR = "GET_PARCELS_BY_SPECULATOR";
export const GET_PARCELS_BY_QUERY = "GET_PARCELS_BY_QUERY";
export const GET_YEAR = "GET_YEAR";

function getInitialMapDataAction(data) {
  return {
    type: GET_INITIAL_MAP_DATA,
    payload: { ppraxis: data }
  };
}

function getInitialZipcodeDataAction(data) {
  return {
    type: GET_INITIAL_ZIPCODE_DATA,
    payload: { zips: data }
  };
}

export function getYearAction(year) {
  return {
    type: GET_YEAR,
    payload: { year }
  };
}

export function getParcelsByQueryAction(data) {
  return {
    type: GET_PARCELS_BY_QUERY,
    payload: { ppraxis: data }
  };
}

export function handleGetInitialMapDataAction(route) {
  return dispatch => {
    return getInitialMapData(route)
      .then(json => {
        dispatch(getInitialMapDataAction({}));
        dispatch(getInitialMapDataAction(json));
        return json;
      })
      .catch(err => {
        throw Error(`An error occured searching: ${err}`);
      });
  };
}

export function handleGetInitialZipcodeDataAction(route) {
  return dispatch => {
    return getInitialZipcodeData(route)
      .then(json => {
        dispatch(getInitialZipcodeDataAction({}));
        dispatch(getInitialZipcodeDataAction(json));
        return json;
      })
      .catch(err => {
        throw Error(`An error occured searching: ${err}`);
      });
  };
}


export function handleGetParcelsByQueryAction(route) {
  return dispatch => {
    return getMapData(route)
      .then(json => {
        dispatch(getParcelsByQueryAction(json));
        dispatch(getParcelsByQueryAction(json));
        return json;
      })
      .catch(err => {
        throw Error(`An error occured searching: ${err}`);
      });
  };
}


// this action is the same as getInitialMapDataAction
// export function getParcelsByZipcodeAction(data) {
//   return {
//     type: GET_PARCELS_BY_ZIPCODE,
//     payload: { ppraxis: data }
//   };
// }

// export function getParcelsBySpeculatorAction(data) {
//   return {
//     type: GET_PARCELS_BY_SPECULATOR,
//     payload: { ppraxis: data }
//   };
// }

// export function handleGetParcelsByZipcodeAction(route) {
//   return dispatch => {
//     return getMapData(route)
//       .then(json => {
//         // dispatch(getParcelsByZipcodeAction({}));
//         dispatch(getParcelsByZipcodeAction(json));
//         return json;
//       })
//       .catch(err => {
//         throw Error(`An error occured searching: ${err}`);
//       });
//   };
// }

// export function handleGetParcelsBySpeculatorAction(route) {
//   return dispatch => {
//     return getMapData(route).then(json => {
//       // dispatch(getParcelsByZipcodeAction({}));
//       dispatch(getParcelsBySpeculatorAction(json));
//       return json;
//     });
//   };
// }