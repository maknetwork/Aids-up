import React, { useEffect } from 'react'
import { ActivityIndicator, View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/Hooks'
import { Brand } from '@/Components'
import { setDefaultTheme } from '@/Store/Theme'
import { navigateAndSimpleReset } from '@/Navigators/utils'
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  checkMultiple,
} from 'react-native-permissions'
import { Dialog, Portal, Button, Paragraph } from 'react-native-paper'
import { showMessage } from 'react-native-flash-message'
const StartupContainer = () => {
  const { Layout, Gutters, Fonts } = useTheme()

  const [visible, setVisible] = React.useState(false)

  const init = async () => {
    await setDefaultTheme({ theme: 'default', darkMode: null })

    const permissions = await checkMultiple([
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ])
    console.log(permissions)
    let exists = Object.values(permissions).includes(
      'denied' || 'blocked' || 'limted',
    )
    if (exists) {
      setVisible(true)
    } else {
      navigateAndSimpleReset('Main')
    }
  }

  const checkAndRequestPermissions = async () => {
    const status = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
    console.log(status)
    if (status === RESULTS.GRANTED) {
      return true
    }
    if (status === RESULTS.DENIED) {
      const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
      console.log('old ', status)
      if (status === RESULTS.GRANTED) {
        return true
      }
      return false
    }

    return false
  }

  useEffect(() => {
    init()
  })

  return (
    <View style={[Layout.fill, Layout.colCenter]}>
      <Brand />
      <ActivityIndicator size={'large'} style={[Gutters.largeVMargin]} />
      <Portal>
        {/* permissions dialog */}
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>{'Please allow permissions to continue'}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              We need to access your location & BLE to scan for nearby devices
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setVisible(false)
                navigateAndSimpleReset('Main')
              }}
            >
              {'Cancel'}
            </Button>
            <Button
              onPress={async () => {
                setVisible(false)
                const permiss = await checkAndRequestPermissions()
                if (permiss) {
                  navigateAndSimpleReset('Main')
                }
              }}
            >
              {'OK'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

export default StartupContainer
