import React from "react";
import Sidebar from "./sidebar.jsx";
import SidebarFetching from "./sidebar-fetching.jsx";
import SidebarDetails from "./sidebar-details.jsx";
import Map from "./map.jsx";
import Alert from "./alert.jsx";
import MapState from "../state";
import MapActions from "../actions";

let getMapState = function(props) {
  return MapState.getState();
};

/**
 * Controls the sidebar views, and the map
 */
export default class MainView extends React.Component {
  constructor(props) {
    super(props);

    this.state = getMapState();
  }

  componentDidMount() {
    MapState.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    MapState.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(getMapState());
  }

  render() {
    let sidebar;
    let classString = "map";

    if (this.state.isOpen) {
      classString += " open";
    }

    if (this.state.isFetching) {
      sidebar = <SidebarFetching place={this.state.fetchingPlace} />;
    } else {
      if (this.state.isDetail) {
        sidebar = <SidebarDetails poi={this.state.sets[this.state.activeSetIndex].items[this.state.poi]} />
      } else {
        sidebar = <Sidebar location={this.state.currentLocation} sets={this.state.sets} activeSetIndex={this.state.activeSetIndex} customPanel={this.state.customPanel}/>
      }
    }

    let activeSet = this.state.sets[this.state.activeSetIndex];

    return (
      <div className={classString}>
        <div className="close-map" onClick={this.closeMap}>Close</div>
        <Map pins={activeSet} location={this.state.location} index={this.state.activeIndex} />
        {sidebar}
        <Alert error={this.state.error} />
      </div>
    );
  }

  // TODO: Trigger an action here, try not to call dispatcher directly
  closeMap() {
    MapActions.mapClose()
  }

}