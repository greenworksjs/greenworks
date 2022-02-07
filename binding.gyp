{
  'variables': {
    'source_root_dir': '<!(python tools/source_root_dir.py)',
    'steamworks_sdk_dir': '<(source_root_dir)/deps/steamworks_sdk',
    'target_dir': '<(source_root_dir)/lib'
  },

  'conditions': [
    ['OS=="win"', {
      'conditions': [
        ['target_arch=="ia32"', {
          'variables': {
            'project_name': 'greenworks-win32',
            'redist_bin_dir': '',
            'lib_steam': 'steam_api.lib',
            'lib_dll_steam': 'steam_api.dll',
          },
        }],
        ['target_arch=="x64"', {
          'variables': {
            'project_name': 'greenworks-win64',
            'redist_bin_dir': 'win64',
            'lib_steam': 'steam_api64.lib',
            'lib_dll_steam': 'steam_api64.dll',
          },
        }],
      ],
    }],
    ['OS=="mac"', {
      'conditions': [
        ['target_arch=="ia32"', {
          'variables': {
            'project_name': 'greenworks-osx32',
            'redist_bin_dir': 'osx32'
          },
        }],
        ['target_arch=="x64"', {
          'variables': {
            'project_name': 'greenworks-osx64',
            'redist_bin_dir': 'osx'
          },
        }],
      ],
      'variables': {
        'lib_steam': 'libsteam_api.dylib'
      },
    }],
    ['OS=="linux"', {
      'conditions': [
        ['target_arch=="ia32"', {
          'variables': {
            'project_name': 'greenworks-linux32',
            'redist_bin_dir': 'linux32',
            'lib_steam': 'libsteam_api.so'
          }
        }],
        ['target_arch=="x64"', {
          'variables': {
            'project_name': 'greenworks-linux64',
            'redist_bin_dir': 'linux64',
            'lib_steam': 'libsteam_api.so'
          }
        }],
      ],
    }],
  ],

  'targets': [
    {
      'target_name': '<(project_name)',
      'sources': [
        'src/greenworks_api.cc',
        'src/greenworks_async_workers.cc',
        'src/greenworks_async_workers.h',
        'src/greenworks_workshop_workers.cc',
        'src/greenworks_workshop_workers.h',
        'src/greenworks_utils.cc',
        'src/greenworks_utils.h',
        'src/greenworks_unzip.cc',
        'src/greenworks_unzip.h',
        'src/greenworks_zip.cc',
        'src/greenworks_zip.h',
        'src/steam_callbacks.cc',
        'src/steam_callbacks.h',
        'src/steam_async_worker.cc',
        'src/steam_async_worker.h',
      ],
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include_dir")',
        'deps',
        'src',
        '<(steamworks_sdk_dir)/public',
      ],
      'dependencies': [ 'deps/third_party/zlib/zlib.gyp:minizip' ],
      'link_settings': {
        'libraries': [
          '<(steamworks_sdk_dir)/redistributable_bin/<(redist_bin_dir)/<(lib_steam)'
        ]
      },
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      'conditions': [
        ['OS== "linux"',
          {
            'ldflags': [
              '-Wl,-rpath,\$$ORIGIN',
            ]
          },
        ],
        ['OS== "win" and target_arch=="x64"',
          {
            'defines': [
              '_AMD64_',
            ],
          },
        ],
        # For zlib.gyp::minizip library.
        ['OS=="mac" or OS=="ios" or OS=="android"', {
          # Mac, Android and the BSDs don't have fopen64, ftello64, or
          # fseeko64. We use fopen, ftell, and fseek instead on these
          # systems.
          'defines': [
            'USE_FILE32API'
          ],
        }],
      ],
      'cflags': [ '-std=c++14', '-Wno-deprecated-declarations', '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'WARNING_CFLAGS':  [
          '-Wno-deprecated-declarations',
        ],
        'OTHER_CPLUSPLUSFLAGS' : [
          '-std=c++14',
          # '-stdlib=libc++'
        ],
        # 'OTHER_LDFLAGS': [
        #   '-stdlib=libc++'
        # ],
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        # match steamworks sdk version
        'MACOSX_DEPLOYMENT_TARGET': '10.10',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'msvs_disabled_warnings': [
        4068,  # disable unknown pragma warnings from nw.js custom node_buffer.h.
        4267,  # conversion from 'size_t' to 'int', popssible loss of data
        4996, # deprecated warnings
      ],
    },
    {
      'target_name': 'copy_binaries',
      'dependencies': [
        '<(project_name)'
      ],
      'type': 'none',
      'actions': [
        {
          'action_name': 'Copy Binaries',
          'variables': {
            'conditions': [
              ['OS=="win"', {
                'lib_steam_path': '<(steamworks_sdk_dir)/redistributable_bin/<(redist_bin_dir)/<(lib_dll_steam)',
              }],
              ['OS=="mac" or OS=="linux"', {
                'lib_steam_path': '<(steamworks_sdk_dir)/redistributable_bin/<(redist_bin_dir)/<(lib_steam)',
              }],
            ]
          },
          'inputs': [
            '<(lib_steam_path)',
            '<(PRODUCT_DIR)/<(project_name).node'
          ],
          'outputs': [
            '<(target_dir)',
          ],
          'action': [
            'python',
            '<(source_root_dir)/tools/copy_binaries.py',
            '<@(_inputs)',
            '<@(_outputs)',
          ],
        }
      ],
    },
  ]
}
