_                       = require 'lodash'
{ CleverBufferReader }  = require 'clever-buffer'
preCompile              = require './preCompile'
typeHelper              = require './type-helper'



class Reader

  constructor: (buffer, @typeSet, options={}) ->
    @buffer = new CleverBufferReader(buffer, options)
    if not @typeSet
      @typeSet = preCompile {}

  # processObject: (object, parameter) =>
  #   return object._read.apply @, [parameter] if object.hasOwnProperty '_read'
  #   _.reduce object, ((res, value) =>
  #     key = Object.keys(value)[0]
  #     res[key] = @read value[key], parameter, res
  #     res) , {}

  processObject: (object, options) =>
    # console.log "here1: #{JSON.stringify options}"
    return object._read.apply @, [options] if object.hasOwnProperty '_read'
    _.reduce object, ((res, value) =>
      key = Object.keys(value)[0]
      res[key] = @read value[key], options, res
      res) , {}

  read: (typeName, options, result={}) ->
    console.log "Reader.read"
    console.log typeName, options

    { parameter, encoding } = options if options

    # parameter =
    #   if parameters?.isArray
    #     parameters?[0]
    #   else
    #     parameters
    # console.log @typeSet.definitions
    type = @typeSet.definitions[typeName]
    if not type
      type = @typeSet.definitions[typeName] = typeHelper.getTypeInfo(typeName, @typeSet.types)

    parameter = typeHelper.getParameterFromResult type.parameter, result if type.isFunction
      # if type.isFunction
      #   typeHelper.getParameterFromResult type.parameter, result
      # else if parameters?.isArray
      #   parameters?[0]
      # else
      #   parameters

    # console.log "type: #{JSON.stringify type}"
    # console.log "parameter: #{parameter}"

    switch (typeof type.value)
      when 'undefined'
        throw new Error "#{type.name} isn't a valid type"
      when 'string'
        # parameters?.unshift type
        # console.log parameters
        # @read.apply this, type, parameters
        # console.log options, 'hello4'
        @read type.value, parameter, encoding
      when 'function'
        console.log "parameter: #{parameter}"
        type.value.apply @, [parameter]
      when 'object'
        if type.isArray
          _.map [0...Math.floor(typeHelper.getParameterFromResult type.arraySize, result)], =>
            @processObject type.value, parameter or options
        else
          @processObject type.value, parameter or options

module.exports = Reader
