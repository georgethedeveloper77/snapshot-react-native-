import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  CameraRoll,
  Share,
} from "react-native";

//import { Permissions, FileSystem } from "expo";  //ask per save to system
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";
import * as MediaLibrary from "expo-media-library";

import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      isLoading: true,
      images: [],
      scale: new Animated.Value(1),
      isImageFocused: false,
    };

    this.scale = {
      transform: [{ scale: this.state.scale }],
    };

    //actionBar comes up when tapped
    this.actionBarY = this.state.scale.interpolate({
      inputRange: [0.9, 1],
      outputRange: [0, -80],
    });
    this.borderRadius = this.state.scale.interpolate({
      inputRange: [0.9, 1],
      outputRange: [30, 0],
    });
  }

  loadWallpapers = () => {
    axios
      .get(
        "https://api.unsplash.com/photos/random?count=30&client_id=VvigN045zjZAli2uZnbSY61PllqBEn823eywR0-jJzU"
      )
      .then(
        function (response) {
          console.log(response.data);
          this.setState({ images: response.data, isLoading: false });
        }.bind(this)
      )
      .catch(function (error) {
        console.log(error);
      })
      .finally(function () {
        console.log("request completed");
      });
  };

  componentDidMount() {
    this.loadWallpapers();
  }

  //save to camera func
  saveToCameraRoll = async (image) => {
    let cameraPermissions = await Permissions.getAsync(Permissions.CAMERA_ROLL);
    if (cameraPermissions.status !== "granted") {
      cameraPermissions = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    }

    if (cameraPermissions.status === "granted") {
      FileSystem.downloadAsync(
        image.urls.regular,
        FileSystem.documentDirectory + image.id + ".jpg"
      )
        .then(({ uri }) => {
          //deconstruct image
          //CameraRoll.saveToCameraRoll(uri, 'photo')
          MediaLibrary.saveToLibraryAsync(uri)
          //const asset = await MediaLibrary.createAssetAsync(uri)
          //await MediaLibrary.createAlbumAsync("Download", asset, false)
          alert("Saved to Gallery...DCIM");
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      alert("Requires cameral roll permission");
    }
  };

  showControls = (item) => {
    this.setState(
      (state) => ({
        isImageFocused: !state.isImageFocused,
      }),
      () => {
        if (this.state.isImageFocused) {
          Animated.spring(this.state.scale, {
            toValue: 0.9,
          }).start();
        } else {
          Animated.spring(this.state.scale, {
            toValue: 1,
          }).start();
        }
      }
    );
  };

  //share image
  shareWallpaper = async (image) => {
    try {
      await Share.share({
        message: "Checkout this wallpaper " + image.urls.full,
      });
    } catch (error) {
      console.log(error);
    }
  };

  renderItem = ({ item }) => {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "black",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="blue" />
        </View>
        <TouchableWithoutFeedback onPress={() => this.showControls(item)}>
          <Animated.View style={[{ height, width }, this.scale]}>
            <Animated.Image
              style={{
                flex: 1,
                height: null,
                width: null,
                borderRadius: this.borderRadius,
              }}
              source={{ uri: item.urls.regular }}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: this.actionBarY, //actionBar comes up when tapped
            height: 80,
            backgroundColor: "black",
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => this.loadWallpapers()}
            >
              <Ionicons name="md-refresh" color="white" size={40} />
            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => this.shareWallpaper(item)}
            >
              <Ionicons name="md-share" color="green" size={40} />
            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => this.saveToCameraRoll(item)} //save to phone
            >
              <Ionicons name="ios-cloud-download" color="blue" size={40} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  };
  render() {
    return this.state.isLoading ? (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="blue" />
      </View>
    ) : (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <FlatList
          scrollEnabled={!this.state.isImageFocused} //scroll
          horizontal
          pagingEnabled
          data={this.state.images}
          renderItem={this.renderItem}
          keyExtractor={(item) => item.id}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
