import React, { Component } from "react"
import PropTypes, { string } from "prop-types"
import { handleGetViewerImage } from "../../actions/search"
import { calculateDesiredBearing, bearingToBasic } from "../../utils/viewer"
import * as Mapillary from "mapillary-js"
import noImageIcon from "../../assets/img/no_image_icon.svg"

// TODO: TypeError: cnavasPoint is null
class MapViewer extends Component {
  _getViewerImage = ({ longitude, latitude }) => {
    this.props.dispatch(handleGetViewerImage(longitude, latitude))
  }

  _setBearing = (node, mly) => {
    const { searchCoordinates } = this.props.searchState.searchParams
    const { longitude, latitude } = JSON.parse(decodeURI(searchCoordinates))
    if (longitude && latitude) {
      if (!node.fullPano) {
        // We are only interested in setting the bearing for full 360 panoramas.
        return
      }
      const { lat, lon } = node.latLon

      const nodeBearing = node.computedCA
      const desiredBearing = calculateDesiredBearing(
        lat,
        lon,
        latitude,
        longitude
      )

      const basicX = bearingToBasic(desiredBearing, nodeBearing)
      const basicY = 0.5 // Vertical center
      mly.setCenter([basicX, basicY])
    }
  }

  async componentDidMount() {
    const { searchCoordinates } = this.props.searchState.searchParams

    if (searchCoordinates) {
      const { longitude, latitude } = JSON.parse(decodeURI(searchCoordinates))

      const viewer = await this.props.dispatch(
        handleGetViewerImage(longitude, latitude)
      )
      // if a viewer object is returned with params then
      // create a Viewer instance
      if (viewer && viewer.key !== null) {
        // Enable marker component when setting up viewer
        const mly = new Mapillary.Viewer(
          "mly",
          "S3NrdE1uVHdoRVhQeFN6WUZCTzItUTo5MGFlYTRiNjg3ODAxNTNi",
          null,
          {
            component: {
              cover: false,
              marker: true,
            },
          }
        )
        // Create a non interactive simple marker with default options
        const defaultMarker = new Mapillary.MarkerComponent.SimpleMarker(
          "default-id",
          { lat: latitude, lon: longitude },
          { color: "#e4002c" }
        )

        // Add markers to component
        const markerComponent = mly.getComponent("marker")
        markerComponent.add([defaultMarker]) //interactiveMarker,

        // Adjust the viewer after moving to close coords
        const node = await mly.moveCloseTo(latitude, longitude)

        // setBearing(node);
        this._setBearing(node, mly)

        // Viewer size is dynamic so resize should be called every time the window size changes
        window.addEventListener("resize", function () {
          mly.resize()
        })
      } else {
        console.error(
          `No search coordinates provided for viewer: ${searchCoordinates}`
        )
      }
    }
  }

  render() {
    const { viewer } = this.props.searchState
    const { contentIsVisible } = this.props.searchState.detailedSearch

    if (contentIsVisible && viewer) {
      return (
        <div
          className="map-viewer"
          style={
            contentIsVisible
              ? { visibility: "visible" }
              : { visibility: "hidden" }
          }
          id="mly"
        ></div>
      )
    }
    /* This is ui when the viewer is null */
    return (
      <div
        className="map-viewer"
        style={contentIsVisible ? { display: "block" } : { display: "none" }}
      >
        <div className="no-viewer-image">
          <img
            src={noImageIcon}
            alt="An illustration to indicate no image returned"
          ></img>
          <span>Image not available.</span>
        </div>
      </div>
    )
  }
}

MapViewer.propTypes = {
  searchState: PropTypes.shape({
    viewer: PropTypes.shape({ key: PropTypes.string.isRequired }.isRequired),
    searchCoordinates: PropTypes.oneOf([null, string]).isRequired,
  }).isRequired,
}

export default MapViewer
