import React, { Component } from 'react'
import { Row, Col, Table, DropdownButton, MenuItem } from 'react-bootstrap'
import { message_object } from "../Message"
import config from "../Config.json"
import moment from "moment"
import { LineChart } from 'rd3'

class MCProConsoleAnalyticsDailyPage extends Component
{
    constructor()
    {
        super();
        this.state = {
            dailyCounts: null,
            queryType: "all"
        }
    }

    componentDidMount()
    {
        this.callData();
    }

    callData(event)
    {
        this.setState({ dailyCounts: null });
        message_object.doFetch("daily count", config.serverHost + 'analyze/daily?type=' + this.state.queryType, {}, function (result) {
            result.json().then(function (daily) {
                this.setState({ dailyCounts: daily });
            }.bind(this));
            return 'ok'
        }.bind(this));
        if (event) event.preventDefault();
    }

    selectQueryType(eventKey)
    {
        this.setState({queryType: eventKey});
        this.state.queryType = eventKey;
        this.callData();
    }

    render()
    {
        return <Row>
            <Col md={4} xs={12}>
                <DropdownButton id="query_type" title={{all: '全部', entertain: '娱乐', athletic: '竞技'}[this.state.queryType]} onSelect={this.selectQueryType.bind(this)}>
                    <MenuItem eventKey="all">全部</MenuItem>
                    <MenuItem eventKey="entertain">娱乐</MenuItem>
                    <MenuItem eventKey="athletic">竞技</MenuItem>
                </DropdownButton>
            </Col>
            <Col md={12} xs={12}>
                {
                    this.state.dailyCounts ? <LineChart
                        data={[{name:"", values:this.state.dailyCounts}]}
                        width='100%'
                        height={400}
                        viewBoxObject={{
                            x: 0,
                            y: 0,
                            width: 700,
                            height: 400
                        }}
                        xAccessor={d=>new Date(d.day)}
                        yAccessor={d=>parseFloat(d.day_active_users)}
                        title="日活走势"
                        yAxisLabel="日活跃指数"
                        xAxisLabel="日期"
                        domain={{ y: [0, ] }}
                        xAxisFormatter={x => moment(x).format("MM-DD")}
                        xAxisTickInterval={{interval: 7}}
                        gridHorizontal={true} /> : ""
                }
            </Col>
            <Col md={4} xs={12}>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <td>日期</td>
                            <td>日活</td>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        this.state.dailyCounts ?
                            this.state.dailyCounts.map(function (daily) {
                                return <tr>
                                    <td>{moment(daily.day).format("YYYY-MM-DD")}</td>
                                    <td>{daily.day_active_users}</td>
                                </tr>
                            })
                        : <tr><td colSpan="2">正在载入...</td></tr>
                    }
                    </tbody>
                </Table>
            </Col>
        </Row>
    }
    /*
                <form>
                    <InputGroup>
                        <InputGroup.Button>
                        </InputGroup.Button>
                    </InputGroup>
                </form>*/
    // <InputGroup.Addon>类别</InputGroup.Addon>
    // <Button type="submit" onClick={this.callData.bind(this)} bsStyle="primary">查询</Button>
}

export default MCProConsoleAnalyticsDailyPage;