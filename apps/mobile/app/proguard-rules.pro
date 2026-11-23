# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified in
# /sdk/tools/proguard/proguard-android.txt

# Retrofit
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepattributes AnnotationDefault

-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

-dontwarn kotlin.Unit

-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Coil
-keep class coil.** { *; }
-keep class coil.compose.** { *; }

# Media3
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }

# Kotlinx serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keep,includedescriptorclasses class id.rynex.soraku.data.remote.dto.**$$serializer { *; }

# Keep data classes for serialization
-keep class id.rynex.soraku.data.remote.dto.** { *; }
-keep class id.rynex.soraku.domain.model.** { *; }

# Hilt
-keep class id.rynex.soraku.SorakuApplication { *; }
-keep class id.rynex.soraku.MainActivity { *; }
-keep class dagger.** { *; }
-keep class javax.inject.** { *; }
-keep class javax.annotation.** { *; }
-keep class *$$ModuleAdapter { *; }
-keep class *$$Providers { *; }
-keep class *$$IntoMap { *; }
-keep class *$$Factory { *; }
-keep class *$$Subcomponent { *; }

# ViewModel
-keep class * extends androidx.lifecycle.ViewModel { *; }
-keep class * extends androidx.lifecycle.ViewModelProvider { *; }

# Compose
-keep class androidx.compose.** { *; }
-keep interface androidx.compose.** { *; }
