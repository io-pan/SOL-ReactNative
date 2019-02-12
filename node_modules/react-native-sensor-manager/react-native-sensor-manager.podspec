Pod::Spec.new do |s|
  s.name         = "react-native-sensor-manager"
  s.version      = "0.1"
  s.license      = "NONE"
  s.homepage     = "https://github.com/kprimice/react-native-sensor-manager"
  s.authors      = { 'Kevin Primicerio' => 'kevin.primicerio@gmail.com' }
  s.summary      = "A React Native module that allows you to use the native sensorManager in order to use the accelerometer, gyroscope and magnetometer"
  s.source       = { :git => "https://github.com/marcshilling/react-native-sensor-manager" }
  
  s.dependency 'React'
end
