import {connect} from "../src";
import {Order} from "./order.entity";
import {Item} from "./item.entity";

connect({
    uri: process.env.MONGO_URL || 'mongodb+srv://aggregator_dev:aggregator_dev@cluster0-epwwu.gcp.mongodb.net/smartemail-types'
})
    .then(() => Order.findOneOrFail({
        qty: {
            $ne: 10
        }
    }))
    .then(order => {

        order.qty++;

        return order.save()
    })
    .then(order => {

        void order;

        return new Order({ qty: 10 }).save()
    })
    .then(order => {

        void order;

        return Item.findOne()
    })
    .then(item => {

        void item;
    })
    .catch(err => {

        void err
    })


