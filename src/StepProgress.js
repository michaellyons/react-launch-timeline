import React from 'react'
import PropTypes from 'prop-types'
import Chart from './Chart'
import ControlledProgress from './common/ControlledProgress'

import { line } from 'd3-shape'
import { extent } from 'd3-array'
import { scaleLinear } from 'd3-scale'

const defaultMargin = {
  top: 40, right: 40, bottom: 10, left: 50
}

export default class StepProgress extends React.Component {
  static propTypes = {
    progress: PropTypes.number,
    step: PropTypes.number,
    height: PropTypes.number,
    width: PropTypes.number,
    xData: PropTypes.string,
    labelPos: PropTypes.string,
    title: PropTypes.string,
    titleBkg: PropTypes.string,
    mainBkg: PropTypes.string,
    duration: PropTypes.number,
    speed: PropTypes.number,
    data: PropTypes.array,
    margin: PropTypes.object,
    showDots: PropTypes.bool,
    showLabels: PropTypes.bool,
    showTicks: PropTypes.bool,
    goalDotStyle:PropTypes.object,
    goalCompleteDotStyle:PropTypes.object,
    titleStyle:PropTypes.object,
    textStyle:PropTypes.object,
    dotStyle:PropTypes.object,
    dotCompleteStyle:PropTypes.object,
    progressStyle:PropTypes.object,
    wrapStyle:PropTypes.object,
    style:PropTypes.object,
    onComplete: PropTypes.func
  };
  static defaultProps = {
    height: 100,
    margin:{
      top: 40, right: 40, bottom: 10, left: 50
    },
    showDots: true,
    speed: 800,
    xData: 'date',
    showGoal: true,
    textStyle: {
      fontSize: '14px',
      fill: '#fffff'
    },
    dotCompleteStyle: {
      fill: '#0088d1'
    },
    goalCompleteDotStyle: {
      fill: 'darkgreen'
    }
  };
  constructor (props) {
    super(props)
    this.data = []
    this.state = {
      updateTime: 0,
      complete: false,
      completed: props.progress || 0,
      progress: null,
      width: props.width || 1000
    }
    this.getWidth = this.getWidth.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.complete = this.complete.bind(this)
    this._getStateValue = this._getStateValue.bind(this)
    this._updateStateValue = this._updateStateValue.bind(this)
    this.onComplete = this.onComplete.bind(this)
    this.createChart = this.createChart.bind(this)
    this.doThing = this.doThing.bind(this)
  }
  componentDidMount () {
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  }
  componentDidUpdate (lastProps, lastState) {
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }
  handleResize () {
    this.setState({ width: this.getWidth() })
  }
  getWidth () {
    return this.refs.container.offsetWidth
  }
  reset () {
    this.setState({ completed: this.props.progress || 0, complete: false })
  }
  complete () {
    this.setState({ complete: true, play: false })
  }
  _getStateValue (prop) {
    return this.state[prop]
  }
  _updateStateValue (prop, value, resolve) {
    let { ...state } = this.state
    state[prop] = value
    this.setState(state)
  }
  createChart (_self) {
    let { margin } = _self.props
    margin = Object.assign({}, defaultMargin, margin)
    this.w = this.state.width - (margin.left + margin.right)

    let height = this.props.height - (margin.top + margin.bottom)

    this.h = height

    this.xScale = scaleLinear()
          .domain(this.extent)
          .rangeRound([0, this.w])

    this.yScale = scaleLinear()
          .domain([0, height])
          .range([this.h, 0])

    this.line = line()
          .x((d) => {
            return d && this.xScale(d[_self.props.xData] || 0)
          })
          .y((d) => {
            return this.yScale(height / 2)
          })

    this.transform = 'translate(' + this.props.margin.left + ',' + this.props.margin.top + ')'
  }
  doThing () {
    let { data, step } = this.props
    let stepFocus = step
    let datum = data[stepFocus]
    // If item has onComplete function, call it
    if (datum.onComplete && typeof datum.onComplete === 'function') {
      datum.onComplete()
    }

    // On Last Item? run on Complete
    if (stepFocus === data.length - 1) {
      this.onComplete(step)
    } else {
      this.setState({ completed: step })
    }
  }
  onComplete (step) {
    // console.log('Done with Timeline!')
    // this.refs.timeline.stop()
    this.setState({ completed: step })
    if (this.props.onComplete) {
      this.props.onComplete()
    }
  }
  render () {
    let {
      completed,
      width
    } = this.state
    let {
        height,
        duration,
        progress,
        step,
        speed,
        data,
        xData,
        progressStyle,
        wrapStyle,
        style,
        ...chartProps
    } = this.props

    let complete = completed === data.length - 1

    let _self = this
    if (!data) return null
    let parsedData
    let scaleHalf
    let stepScale
    if (data && data.length) {
      parsedData = data.map((d, i) => {
        return {
          ...d,
          date: i
        }
      })
      this.data = parsedData
      this.extent = extent(parsedData, function (d) {
        return d[xData]
      })
      this.createChart(_self)
      if (this.data[step]) {
        stepScale = this.xScale(this.data[step][xData])
      }
      scaleHalf = this.yScale(this.h / 2)
    }

    return (
      <div ref={'container'} style={{ position: 'relative', height: height, ...wrapStyle }}>
        <Chart
          key={width}
          xData={xData}
          completed={completed}
          xScale={this.xScale}
          complete={complete}
          now={stepScale}
          height={height}
          width={width}
          data={this.data}
          {...chartProps}
          style={{ position: 'relative', ...style }}>
          <ControlledProgress
            ref='timeline'
            id={'chart_progress'}
            style={{ fill: '#eee', ...progressStyle }}
            height={8}
            data={this.data}
            tweenDone={this.doThing}
            y={scaleHalf - 4}
            progress={stepScale || 0}
            duration={duration}
            speed={speed}
            complete={complete} />
        </Chart>
      </div>)
  }
}
