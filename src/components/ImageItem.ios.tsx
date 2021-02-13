/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useRef, useState } from 'react'

import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableWithoutFeedback,
  GestureResponderEvent
} from 'react-native'
import GracefullyImage from '../../../../components/GracefullyImage'

import useDoubleTapToZoom from '../hooks/useDoubleTapToZoom'

import { getImageStyles, getImageTransform } from '../utils'
import { ImageSource } from '../@types'

const SWIPE_CLOSE_OFFSET = 75
const SWIPE_CLOSE_VELOCITY = 0.55
const SCREEN = Dimensions.get('screen')
const SCREEN_WIDTH = SCREEN.width
const SCREEN_HEIGHT = SCREEN.height

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onZoom: (scaled: boolean) => void
  onLongPress: (image: ImageSource) => void
  delayLongPress: number
  swipeToCloseEnabled?: boolean
  doubleTapToZoomEnabled?: boolean
}

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const [scaled, setScaled] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({
    width: imageSrc.width || 0,
    height: imageSrc.height || 0
  })
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN)

  const [translate, scale] = getImageTransform(imageDimensions, SCREEN)
  const scrollValueY = new Animated.Value(0)
  const scaleValue = new Animated.Value(scale || 1)
  const translateValue = new Animated.ValueXY(translate)
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1

  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5]
  })
  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  )
  const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity }

  const onScrollEndDrag = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0
      const scaled = nativeEvent?.zoomScale > 1

      onZoom(scaled)
      setScaled(scaled)

      if (
        !scaled &&
        swipeToCloseEnabled &&
        Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY
      ) {
        onRequestClose()
      }
    },
    [scaled]
  )

  const onScroll = ({
    nativeEvent
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0

    if (nativeEvent?.zoomScale > 1) {
      return
    }

    scrollValueY.setValue(offsetY)
  }

  const onLongPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      onLongPress(imageSrc)
    },
    [imageSrc, onLongPress]
  )

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.imageScrollContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
        {...(swipeToCloseEnabled && {
          onScroll
        })}
      >
        <TouchableWithoutFeedback
          onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          <Animated.View
            // @ts-ignore
            style={imageStylesWithOpacity}
            children={
              <GracefullyImage
                uri={{
                  preview: imageSrc.preview_url,
                  original: imageSrc.url,
                  remote: imageSrc.remote_url
                }}
                {...((!imageSrc.width || !imageSrc.height) && {
                  setImageDimensions
                })}
                style={{ flex: 1 }}
              />
            }
          />
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT
  }
})

export default React.memo(ImageItem)
